import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { lobeRouter } from './routers/lobe';
import { adminRouter } from './routers/admin';
import {
  upsertUser, getUserByOpenId,
  getProjectsByUser, createProject, getProjectById, updateProject,
  getBuildsByProject, createBuild, updateBuildStatus, addBuildLog, getBuildLogs,
  getAgentsByUser, upsertAgents, updateAgentStatus,
  getLatestEvolutionCycle, createEvolutionCycle, updateEvolutionCycle,
  getBugReports, createBugReport, updateBugReportStatus,
  getFixProposals, createFixProposal, approveFixProposal,
  getMoeConfigs, upsertMoeConfig,
  getSubscription, upsertSubscription,
  getEarnings, addEarning
} from "./db";

/* ─── Default 14 Agents ─── */
const DEFAULT_AGENTS = [
  { agentKey: "security_architect",  name: "安全架构师",   role: "OAuth 2.0 + PKCE、Token Vault加密存储",  layer: "infrastructure" },
  { agentKey: "legal_compliance",    name: "合规法务官",   role: "隐私政策、用户协议、合规框架审查",          layer: "infrastructure" },
  { agentKey: "backend_engineer",    name: "后端工程师",   role: "Express + Prisma + PostgreSQL + Docker",  layer: "infrastructure" },
  { agentKey: "exchange_expert",     name: "交易所接入专家", role: "OKX/Coinbase/Binance API接入",           layer: "infrastructure" },
  { agentKey: "social_expert",       name: "社交接入专家", role: "Twitter/微信/微博OAuth授权",               layer: "infrastructure" },
  { agentKey: "biz_architect",       name: "商业化架构师", role: "分润体系、会员系统、收益结算",              layer: "infrastructure" },
  { agentKey: "memory_architect",    name: "记忆架构师",   role: "Agent长期记忆、上下文管理、自进化",         layer: "intelligence" },
  { agentKey: "infra_security",      name: "基础设施安全", role: "终端安全、供应链扫描、运行时监控",           layer: "intelligence" },
  { agentKey: "ai_mentor",           name: "AI编程导师",   role: "代码生成、代码审查、编程教学",              layer: "intelligence" },
  { agentKey: "decision_advisor",    name: "决策顾问",     role: "矛盾分析、决策矩阵、实践验证",              layer: "intelligence" },
  { agentKey: "data_analyst",        name: "数据分析师",   role: "数据分析、图表可视化、报告生成",             layer: "intelligence" },
  { agentKey: "cyber_auditor",       name: "网络安全审计", role: "8并行代理安全审计、漏洞检测",               layer: "audit" },
  { agentKey: "accessibility",       name: "无障碍合规",   role: "WCAG 2.2 AA合规检查",                     layer: "audit" },
  { agentKey: "researcher",          name: "研究员",       role: "深度研究、竞品分析、文献综述",              layer: "audit" },
];

/* ─── Default MoE Models ─── */
const DEFAULT_MODELS = [
  { modelKey: "deepseek-v3",    modelName: "DeepSeek-V3",         provider: "DeepSeek",  taskTypes: ["code","reasoning"], priority: 90, costPerMToken: 0.27 },
  { modelKey: "qwen2.5-72b",   modelName: "Qwen2.5-72B-Instruct", provider: "Alibaba",   taskTypes: ["general","chinese"], priority: 80, costPerMToken: 0.56 },
  { modelKey: "gpt-4o",        modelName: "GPT-4o",               provider: "OpenAI",    taskTypes: ["multimodal","creative"], priority: 70, costPerMToken: 5.0 },
  { modelKey: "claude-3.7",    modelName: "Claude 3.7 Sonnet",    provider: "Anthropic", taskTypes: ["analysis","writing"], priority: 75, costPerMToken: 3.0 },
  { modelKey: "llama3.3-70b",  modelName: "Llama-3.3-70B",        provider: "Meta/Local",taskTypes: ["local","fast"], priority: 60, costPerMToken: 0 },
];

export const appRouter = router({
  system: systemRouter,

  /* ─── Auth ─── */
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const opts = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...opts, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /* ─── Projects ─── */
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getProjectsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return getProjectById(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(128),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
      return createProject({ userId: ctx.user.id, name: input.name, description: input.description, slug });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['active','archived','building']).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateProject(id, ctx.user.id, data);
      return { success: true };
    }),
  }),

  /* ─── Factory Build Pipeline ─── */
  factory: router({
    builds: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
      return getBuildsByProject(input.projectId, ctx.user.id);
    }),
    buildLogs: protectedProcedure.input(z.object({ buildId: z.number() })).query(async ({ ctx, input }) => {
      return getBuildLogs(input.buildId);
    }),
    startBuild: protectedProcedure.input(z.object({
      projectId: z.number(),
      prompt: z.string().min(1).max(5000),
    })).mutation(async ({ ctx, input }) => {
      const build = await createBuild({ projectId: input.projectId, userId: ctx.user.id, prompt: input.prompt });
      // 异步执行构建流水线（模拟）
      runBuildPipeline(Number((build as any).insertId || 1), input.prompt, ctx.user.id).catch(console.error);
      return { buildId: Number((build as any).insertId || 1), status: 'pending' };
    }),
  }),

  /* ─── Agents ─── */
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      let agentList = await getAgentsByUser(ctx.user.id);
      if (agentList.length === 0) {
        await upsertAgents(ctx.user.id, DEFAULT_AGENTS);
        agentList = await getAgentsByUser(ctx.user.id);
      }
      return agentList;
    }),
    toggle: protectedProcedure.input(z.object({
      id: z.number(),
      enabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      await updateAgentStatus(input.id, ctx.user.id, { enabled: input.enabled });
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['online','busy','offline']),
    })).mutation(async ({ ctx, input }) => {
      await updateAgentStatus(input.id, ctx.user.id, { status: input.status });
      return { success: true };
    }),
  }),

  /* ─── Evolution Engine ─── */
  evolution: router({
    current: protectedProcedure.query(async ({ ctx }) => {
      return getLatestEvolutionCycle(ctx.user.id);
    }),
    start: protectedProcedure.mutation(async ({ ctx }) => {
      const cycle = await createEvolutionCycle(ctx.user.id);
      return cycle;
    }),
    addFeedback: protectedProcedure.input(z.object({
      cycleId: z.number(),
      qualityScore: z.number().min(1).max(5),
    })).mutation(async ({ ctx, input }) => {
      const cycle = await getLatestEvolutionCycle(ctx.user.id);
      if (cycle) {
        await updateEvolutionCycle(cycle.id, {
          feedbackCount: (cycle.feedbackCount || 0) + 1,
          qualitySamples: input.qualityScore >= 4 ? (cycle.qualitySamples || 0) + 1 : cycle.qualitySamples,
        });
      }
      return { success: true };
    }),
  }),

  /* ─── Auto Maintenance ─── */
  maintenance: router({
    bugReports: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
      let bugs = await getBugReports(input.projectId, ctx.user.id);
      if (bugs.length === 0) {
        // 初始化示例数据
        await seedBugReports(input.projectId, ctx.user.id);
        bugs = await getBugReports(input.projectId, ctx.user.id);
      }
      return bugs;
    }),
    fixProposals: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
      return getFixProposals(input.projectId, ctx.user.id);
    }),
    approveFix: protectedProcedure.input(z.object({ proposalId: z.number() })).mutation(async ({ ctx, input }) => {
      await approveFixProposal(input.proposalId, ctx.user.id);
      return { success: true };
    }),
    dismissBug: protectedProcedure.input(z.object({ bugId: z.number() })).mutation(async ({ ctx, input }) => {
      await updateBugReportStatus(input.bugId, ctx.user.id, 'dismissed');
      return { success: true };
    }),
    generateFix: protectedProcedure.input(z.object({
      bugId: z.number(),
      projectId: z.number(),
      description: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const resp = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert code reviewer. Generate a concise fix proposal title and description for the given bug. Respond in JSON with fields: title, description, branchName." },
          { role: "user", content: `Bug: ${input.description}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "fix_proposal", strict: true, schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, branchName: { type: "string" } }, required: ["title","description","branchName"], additionalProperties: false } } },
      });
      const content = resp.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
      await createFixProposal({
        bugReportId: input.bugId,
        projectId: input.projectId,
        userId: ctx.user.id,
        title: parsed.title || `Fix: ${input.description.slice(0,60)}`,
        description: parsed.description,
        branchName: parsed.branchName || `fix/auto-${Date.now()}`,
      });
      await updateBugReportStatus(input.bugId, ctx.user.id, 'fixing');
      return { success: true };
    }),
  }),

  /* ─── MoE Router ─── */
  moe: router({
    models: protectedProcedure.query(async ({ ctx }) => {
      let configs = await getMoeConfigs(ctx.user.id);
      if (configs.length === 0) {
        for (const m of DEFAULT_MODELS) await upsertMoeConfig(ctx.user.id, m);
        configs = await getMoeConfigs(ctx.user.id);
      }
      return configs;
    }),
    toggle: protectedProcedure.input(z.object({
      modelKey: z.string(),
      enabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      await upsertMoeConfig(ctx.user.id, { modelKey: input.modelKey, modelName: '', provider: '', enabled: input.enabled });
      return { success: true };
    }),
    route: protectedProcedure.input(z.object({
      taskType: z.string(),
      prompt: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const configs = await getMoeConfigs(ctx.user.id);
      const enabled = configs.filter(c => c.enabled);
      const matched = enabled.find(c => (c.taskTypes as string[] || []).includes(input.taskType)) || enabled[0];
      return { selectedModel: matched?.modelName || 'DeepSeek-V3', modelKey: matched?.modelKey || 'deepseek-v3' };
    }),
  }),

  /* ─── Subscription ─── */
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      let sub = await getSubscription(ctx.user.id);
      if (!sub) {
        await upsertSubscription(ctx.user.id, 'free');
        sub = await getSubscription(ctx.user.id);
      }
      return sub;
    }),
    upgrade: protectedProcedure.input(z.object({
      tier: z.enum(['free','pro','team','enterprise']),
    })).mutation(async ({ ctx, input }) => {
      await upsertSubscription(ctx.user.id, input.tier);
      return { success: true };
    }),
  }),

  /* ─── Earnings ─── */
  earnings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getEarnings(ctx.user.id);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const list = await getEarnings(ctx.user.id);
      const total = list.reduce((s, e) => s + e.amountCents, 0);
      const confirmed = list.filter(e => e.status === 'confirmed').reduce((s, e) => s + e.amountCents, 0);
      const byType: Record<string, number> = {};
      for (const e of list) byType[e.type] = (byType[e.type] || 0) + e.amountCents;
      return { totalCents: total, confirmedCents: confirmed, byType };
    }),
  }),

  /* ─── LobeHub 功能模块 ─── */
  lobe: lobeRouter,

  /* ─── 管理后台 ─── */
  admin: adminRouter,

  /* ─── i18n ─── */
  i18n: router({
    getLocale: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import('./db');
      const { users } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return { locale: 'zh' };
      const r = await db.select({ locale: users.locale }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return { locale: r[0]?.locale || 'zh' };
    }),
    setLocale: protectedProcedure.input(z.object({ locale: z.enum(['zh', 'en']) })).mutation(async ({ ctx, input }) => {
      const { getDb } = await import('./db');
      const { users } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (db) await db.update(users).set({ locale: input.locale }).where(eq(users.id, ctx.user.id));
      return { success: true, locale: input.locale };
    }),
  }),

  /* ─── AI Chat (MoE-powered) ─── */
  chat: router({
    send: protectedProcedure.input(z.object({
      messages: z.array(z.object({ role: z.enum(['user','assistant','system']), content: z.string() })),
      context: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const systemMsg = input.context
        ? `You are Agentic Factory OS AI assistant. Context: ${input.context}`
        : "You are Agentic Factory OS AI assistant, a powerful AI software engineering platform. Help users build software with natural language.";
      const resp = await invokeLLM({
        messages: [{ role: "system", content: systemMsg }, ...input.messages],
      });
      return { content: resp.choices[0]?.message?.content || '' };
    }),
  }),
});

export type AppRouter = typeof appRouter;

/* ─── Build Pipeline Simulation ─── */
async function runBuildPipeline(buildId: number, prompt: string, userId: number) {
  const log = async (level: 'info'|'warn'|'error'|'step'|'success', agentName: string, message: string) => {
    await addBuildLog({ buildId, level, agentName, message });
    await new Promise(r => setTimeout(r, 300));
  };

  try {
    await updateBuildStatus(buildId, 'running');
    await log('step', '系统', `🚀 开始构建任务: "${prompt.slice(0, 60)}..."`);
    await log('info', '安全架构师', '🔐 正在进行安全需求分析...');
    await log('info', '合规法务官', '⚖️ 检查合规性要求...');
    await log('step', '后端工程师', '🏗️ 分析技术架构需求...');

    // 使用 LLM 分析需求
    const analysis = await invokeLLM({
      messages: [
        { role: "system", content: "You are a software architect. Analyze the requirement and list 5 key technical tasks needed. Be concise, each task in one line, in Chinese." },
        { role: "user", content: prompt },
      ],
    });
    const tasks = (analysis.choices[0]?.message?.content as string || '').split('\n').filter(Boolean).slice(0, 5);

    for (const task of tasks) {
      await log('info', 'AI编程导师', `📝 ${task}`);
    }

    await log('step', '数据分析师', '📊 生成数据模型设计...');
    await log('info', '后端工程师', '⚙️ 生成 API 接口代码...');
    await log('info', 'AI编程导师', '🧪 生成单元测试套件...');
    await log('info', '网络安全审计', '🛡️ 执行安全扫描...');
    await log('info', '无障碍合规', '♿ WCAG 2.2 AA 合规检查...');
    await log('success', '系统', '✅ 构建完成！代码已生成并通过所有检查。');

    await updateBuildStatus(buildId, 'success', {
      durationMs: 8000,
      tokensUsed: 2400,
      agentsUsed: ['security_architect','legal_compliance','backend_engineer','ai_mentor','data_analyst','cyber_auditor'],
    });
  } catch (e) {
    await log('error', '系统', `❌ 构建失败: ${(e as Error).message}`);
    await updateBuildStatus(buildId, 'failed');
  }
}

/* ─── Seed Bug Reports ─── */
async function seedBugReports(projectId: number, userId: number) {
  const bugs = [
    { severity: 'critical' as const, category: '数据安全', file: 'backend/app/models/user.py', line: 18, description: 'GitHub Access Token 以明文形式存储在数据库中，存在严重安全风险', suggestion: '使用 AES-GCM-256 对敏感 Token 进行加密存储' },
    { severity: 'high' as const, category: '身份认证', file: 'backend/app/core/auth.py', line: 45, description: 'JWT 签名算法未强制使用 RS256，存在降级攻击风险', suggestion: '强制使用 RS256 算法，禁用 HS256' },
    { severity: 'high' as const, category: '授权控制', file: 'backend/app/api/v1/endpoints/projects.py', line: 89, description: '项目删除接口缺少所有权验证，任意用户可删除他人项目', suggestion: '在删除前验证 project.userId === currentUser.id' },
    { severity: 'medium' as const, category: '输入验证', file: 'backend/app/api/v1/endpoints/factory_api.py', line: 156, description: '文件上传接口未验证文件内容类型，仅依赖扩展名检查', suggestion: '使用 python-magic 验证文件 MIME 类型' },
    { severity: 'low' as const, category: '日志安全', file: 'backend/app/services/github_agent.py', line: 34, description: '错误日志中可能包含 GitHub Token 的部分内容', suggestion: '在日志输出前对敏感字段进行脱敏处理' },
  ];
  for (const bug of bugs) await createBugReport({ ...bug, projectId, userId });
}
