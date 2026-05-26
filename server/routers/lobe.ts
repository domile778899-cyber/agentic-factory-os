/**
 * Factory Hub - AI 工坊功能路由
 * 包含：助理管理、Skills技能库、MCP集成、模型管理、模型服务商、对话系统
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";

// ─── 默认数据 ───
const DEFAULT_SKILLS = [
  { name: 'Web搜索', description: '实时搜索互联网获取最新信息', category: 'search', icon: '🔍', author: 'Factory Hub', isBuiltin: true, downloadCount: 128000, rating: 4.8 },
  { name: 'Python执行', description: '在沙盒中执行Python代码并返回结果', category: 'code', icon: '🐍', author: 'Factory Hub', isBuiltin: true, downloadCount: 95000, rating: 4.9 },
  { name: '图像生成', description: '使用DALL-E/Stable Diffusion生成图像', category: 'creative', icon: '🎨', author: 'Factory Hub', isBuiltin: true, downloadCount: 87000, rating: 4.7 },
  { name: '文件读写', description: '读取和写入本地文件系统', category: 'system', icon: '📁', author: 'Factory Hub', isBuiltin: true, downloadCount: 76000, rating: 4.6 },
  { name: 'GitHub操作', description: '操作GitHub仓库、Issues、PR', category: 'devtools', icon: '🐙', author: 'Factory Hub', isBuiltin: true, downloadCount: 65000, rating: 4.8 },
  { name: '数据分析', description: '分析CSV/Excel数据并生成可视化图表', category: 'data', icon: '📊', author: 'Factory Hub', isBuiltin: true, downloadCount: 58000, rating: 4.7 },
  { name: 'Telegram通知', description: '发送Telegram消息和通知', category: 'notification', icon: '📱', author: 'Community', isBuiltin: false, downloadCount: 42000, rating: 4.5 },
  { name: '邮件发送', description: '通过SMTP发送电子邮件', category: 'notification', icon: '📧', author: 'Community', isBuiltin: false, downloadCount: 38000, rating: 4.4 },
  { name: '数据库查询', description: '连接并查询MySQL/PostgreSQL数据库', category: 'data', icon: '🗄️', author: 'Community', isBuiltin: false, downloadCount: 35000, rating: 4.6 },
  { name: 'API调用', description: '调用任意REST API接口', category: 'integration', icon: '🔌', author: 'Factory Hub', isBuiltin: true, downloadCount: 72000, rating: 4.7 },
  { name: '文档解析', description: '解析PDF、Word、Excel等文档', category: 'document', icon: '📄', author: 'Factory Hub', isBuiltin: true, downloadCount: 55000, rating: 4.6 },
  { name: '翻译服务', description: '支持100+语言的实时翻译', category: 'language', icon: '🌐', author: 'Community', isBuiltin: false, downloadCount: 48000, rating: 4.5 },
];

const DEFAULT_MCP_SERVERS = [
  { name: 'Brave Search', description: '网页搜索 - 实时搜索互联网', endpoint: 'https://mcp.brave.com/sse', transport: 'sse' as const, toolsCount: 2 },
  { name: 'GitHub MCP', description: 'GitHub 仓库操作工具集', endpoint: 'https://mcp.github.com/sse', transport: 'sse' as const, toolsCount: 18 },
  { name: 'Filesystem', description: '本地文件系统读写操作', endpoint: 'stdio://filesystem', transport: 'stdio' as const, toolsCount: 8 },
  { name: 'Puppeteer', description: '浏览器自动化工具', endpoint: 'stdio://puppeteer', transport: 'stdio' as const, toolsCount: 12 },
  { name: 'Slack', description: 'Slack 消息和频道管理', endpoint: 'https://mcp.slack.com/sse', transport: 'sse' as const, toolsCount: 6 },
];

const DEFAULT_PROVIDERS = [
  { providerKey: 'deepseek', providerName: 'DeepSeek', isFree: true, models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'], baseUrl: 'https://api.deepseek.com/v1' },
  { providerKey: 'qwen', providerName: 'Qwen (通义千问)', isFree: true, models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen2.5-coder-32b-instruct'], baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { providerKey: 'gemini', providerName: 'Google Gemini', isFree: true, models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'], baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { providerKey: 'groq', providerName: 'Groq (超高速)', isFree: true, models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'], baseUrl: 'https://api.groq.com/openai/v1' },
  { providerKey: 'siliconflow', providerName: 'SiliconFlow (硅基流动)', isFree: true, models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Meta-Llama-3.1-70B-Instruct'], baseUrl: 'https://api.siliconflow.cn/v1' },
  { providerKey: 'openai', providerName: 'OpenAI', isFree: false, models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o3-mini'], baseUrl: 'https://api.openai.com/v1' },
  { providerKey: 'anthropic', providerName: 'Anthropic Claude', isFree: false, models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-haiku'], baseUrl: 'https://api.anthropic.com/v1' },
  { providerKey: 'ollama', providerName: 'Ollama (本地)', isFree: true, models: ['llama3.3:70b', 'qwen2.5:72b', 'deepseek-r1:32b'], baseUrl: 'http://localhost:11434/v1' },
];

const DEFAULT_ASSISTANTS = [
  { name: '全栈工程师', avatar: '👨‍💻', description: '精通前后端开发，帮你构建完整的Web应用', systemPrompt: '你是一位经验丰富的全栈工程师，精通React、Node.js、Python、数据库设计。请用清晰的代码和详细的解释帮助用户解决技术问题。', model: 'deepseek-chat', provider: 'deepseek', tags: ['编程', '全栈', '架构'] },
  { name: '产品经理', avatar: '📋', description: '帮你梳理需求、制定产品路线图、分析竞品', systemPrompt: '你是一位资深产品经理，擅长需求分析、用户研究、产品规划。请帮助用户将模糊的想法转化为清晰的产品需求文档。', model: 'deepseek-chat', provider: 'deepseek', tags: ['产品', '需求', '规划'] },
  { name: '安全专家', avatar: '🔐', description: '代码安全审计、漏洞分析、安全加固建议', systemPrompt: '你是一位网络安全专家，精通OWASP Top 10、代码安全审计、渗透测试。请帮助用户识别和修复安全漏洞。', model: 'deepseek-reasoner', provider: 'deepseek', tags: ['安全', '审计', '漏洞'] },
  { name: '数据科学家', avatar: '📊', description: '数据分析、机器学习、可视化图表生成', systemPrompt: '你是一位数据科学家，精通Python数据分析（Pandas、NumPy）、机器学习（Scikit-learn）和数据可视化。请帮助用户分析数据并生成洞察。', model: 'qwen-plus', provider: 'qwen', tags: ['数据', 'ML', '分析'] },
  { name: '创意写作助手', avatar: '✍️', description: '文案创作、故事写作、营销文字', systemPrompt: '你是一位富有创意的写作助手，擅长各类文体写作。请帮助用户创作引人入胜的内容。', model: 'gemini-2.0-flash', provider: 'gemini', tags: ['写作', '创意', '文案'] },
];

export const lobeRouter = router({
  // ─── 助理管理 ───
  assistants: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return DEFAULT_ASSISTANTS.map((a, i) => ({ ...a, id: i + 1, userId: ctx.user.id, isPublic: false, usageCount: Math.floor(Math.random() * 500), temperature: 0.7, maxTokens: 2048, tags: a.tags, createdAt: new Date(), updatedAt: new Date() }));
      try {
        const { sql: sqlRaw } = await import('drizzle-orm');
        const rows = await db.execute(sqlRaw`SELECT * FROM assistants WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC`);
        const list = (rows as any[])[0] || [];
        if (list.length === 0) {
          // Seed defaults
          for (const a of DEFAULT_ASSISTANTS) {
            await db.execute(sqlRaw`INSERT INTO assistants (userId, name, avatar, description, systemPrompt, model, provider, temperature, maxTokens, tags, isPublic, usageCount) VALUES (${ctx.user.id}, ${a.name}, ${a.avatar}, ${a.description}, ${a.systemPrompt}, ${a.model}, ${a.provider}, 0.7, 2048, ${JSON.stringify(a.tags)}, false, 0)`);
          }
          const seeded = await db.execute(sqlRaw`SELECT * FROM assistants WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC`);
          return (seeded as any[])[0] || [];
        }
        return list;
      } catch { return DEFAULT_ASSISTANTS.map((a, i) => ({ ...a, id: i + 1, userId: ctx.user.id, isPublic: false, usageCount: 0, temperature: 0.7, maxTokens: 2048, createdAt: new Date(), updatedAt: new Date() })); }
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(128),
      description: z.string().optional(),
      avatar: z.string().default('🤖'),
      systemPrompt: z.string().optional(),
      model: z.string().default('deepseek-chat'),
      provider: z.string().default('deepseek'),
      temperature: z.number().min(0).max(2).default(0.7),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`INSERT INTO assistants (userId, name, avatar, description, systemPrompt, model, provider, temperature, maxTokens, tags, isPublic, usageCount) VALUES (${ctx.user.id}, ${input.name}, ${input.avatar}, ${input.description || ''}, ${input.systemPrompt || ''}, ${input.model}, ${input.provider}, ${input.temperature}, 2048, ${JSON.stringify(input.tags || [])}, false, 0)`);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`DELETE FROM assistants WHERE id = ${input.id} AND userId = ${ctx.user.id}`);
      return { success: true };
    }),
    chat: protectedProcedure.input(z.object({
      assistantId: z.number().optional(),
      messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() })),
      systemPrompt: z.string().optional(),
      model: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const systemMsg = input.systemPrompt || "You are a helpful AI assistant in Agentic Factory OS.";
      const resp = await invokeLLM({
        messages: [{ role: "system", content: systemMsg }, ...input.messages],
      });
      const content = resp.choices[0]?.message?.content || '';
      // Save to conversation history
      const db = await getDb();
      if (db) {
        const { sql: sqlRaw } = await import('drizzle-orm');
        const lastUserMsg = input.messages[input.messages.length - 1];
        if (lastUserMsg?.role === 'user') {
          const convResult = await db.execute(sqlRaw`INSERT INTO conversations (userId, assistantId, title, model, provider, messageCount) VALUES (${ctx.user.id}, ${input.assistantId || null}, ${lastUserMsg.content.slice(0, 50)}, ${input.model || 'deepseek-chat'}, 'deepseek', 1)`);
          const convId = (convResult as any)[0]?.insertId;
          if (convId) {
            await db.execute(sqlRaw`INSERT INTO messages (conversationId, userId, role, content) VALUES (${convId}, ${ctx.user.id}, 'user', ${lastUserMsg.content})`);
            await db.execute(sqlRaw`INSERT INTO messages (conversationId, userId, role, content) VALUES (${convId}, ${ctx.user.id}, 'assistant', ${content})`);
          }
        }
      }
      return { content, model: input.model || 'deepseek-chat' };
    }),
  }),

  // ─── Skills 技能库 ───
  skills: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return DEFAULT_SKILLS.map((s, i) => ({ ...s, id: i + 1, installed: i < 5 }));
      try {
        const { sql: sqlRaw } = await import('drizzle-orm');
        const rows = await db.execute(sqlRaw`SELECT * FROM skills ORDER BY downloadCount DESC`);
        const list = (rows as any[])[0] || [];
        if (list.length === 0) {
          for (const s of DEFAULT_SKILLS) {
            await db.execute(sqlRaw`INSERT INTO skills (name, description, category, icon, author, isBuiltin, downloadCount, rating) VALUES (${s.name}, ${s.description}, ${s.category}, ${s.icon}, ${s.author}, ${s.isBuiltin}, ${s.downloadCount}, ${s.rating})`);
          }
          const seeded = await db.execute(sqlRaw`SELECT * FROM skills ORDER BY downloadCount DESC`);
          return (seeded as any[])[0] || [];
        }
        // Get user installed skills
        const installed = await db.execute(sqlRaw`SELECT skillId FROM userSkills WHERE userId = ${ctx.user.id} AND enabled = true`);
        const installedIds = new Set(((installed as any[])[0] || []).map((r: any) => r.skillId));
        return list.map((s: any) => ({ ...s, installed: installedIds.has(s.id) }));
      } catch { return DEFAULT_SKILLS.map((s, i) => ({ ...s, id: i + 1, installed: i < 5 })); }
    }),
    install: protectedProcedure.input(z.object({ skillId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`INSERT IGNORE INTO userSkills (userId, skillId, enabled) VALUES (${ctx.user.id}, ${input.skillId}, true)`);
      return { success: true };
    }),
    uninstall: protectedProcedure.input(z.object({ skillId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`DELETE FROM userSkills WHERE userId = ${ctx.user.id} AND skillId = ${input.skillId}`);
      return { success: true };
    }),
  }),

  // ─── MCP 服务器 ───
  mcp: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return DEFAULT_MCP_SERVERS.map((m, i) => ({ ...m, id: i + 1, userId: ctx.user.id, enabled: true, status: 'disconnected', callsCount: Math.floor(Math.random() * 10000), config: {}, createdAt: new Date(), updatedAt: new Date() }));
      try {
        const { sql: sqlRaw } = await import('drizzle-orm');
        const rows = await db.execute(sqlRaw`SELECT * FROM mcpServers WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC`);
        const list = (rows as any[])[0] || [];
        if (list.length === 0) {
          for (const m of DEFAULT_MCP_SERVERS) {
            await db.execute(sqlRaw`INSERT INTO mcpServers (userId, name, description, endpoint, transport, enabled, status, toolsCount, callsCount) VALUES (${ctx.user.id}, ${m.name}, ${m.description}, ${m.endpoint}, ${m.transport}, true, 'disconnected', ${m.toolsCount}, 0)`);
          }
          const seeded = await db.execute(sqlRaw`SELECT * FROM mcpServers WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC`);
          return (seeded as any[])[0] || [];
        }
        return list;
      } catch { return DEFAULT_MCP_SERVERS.map((m, i) => ({ ...m, id: i + 1, userId: ctx.user.id, enabled: true, status: 'disconnected', callsCount: 0, config: {}, createdAt: new Date(), updatedAt: new Date() })); }
    }),
    toggle: protectedProcedure.input(z.object({ id: z.number(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`UPDATE mcpServers SET enabled = ${input.enabled} WHERE id = ${input.id} AND userId = ${ctx.user.id}`);
      return { success: true };
    }),
    connect: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true, status: 'connected' };
      const { sql: sqlRaw } = await import('drizzle-orm');
      // Simulate connection test
      await db.execute(sqlRaw`UPDATE mcpServers SET status = 'connected' WHERE id = ${input.id} AND userId = ${ctx.user.id}`);
      return { success: true, status: 'connected' };
    }),
    add: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      endpoint: z.string().min(1),
      transport: z.enum(['stdio', 'sse', 'http']).default('sse'),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`INSERT INTO mcpServers (userId, name, description, endpoint, transport, enabled, status, toolsCount, callsCount) VALUES (${ctx.user.id}, ${input.name}, ${input.description || ''}, ${input.endpoint}, ${input.transport}, true, 'disconnected', 0, 0)`);
      return { success: true };
    }),
  }),

  // ─── 模型服务商 ───
  providers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return DEFAULT_PROVIDERS.map((p, i) => ({ ...p, id: i + 1, userId: ctx.user.id, apiKey: null, createdAt: new Date(), updatedAt: new Date() }));
      try {
        const { sql: sqlRaw } = await import('drizzle-orm');
        const rows = await db.execute(sqlRaw`SELECT * FROM modelProviders WHERE userId = ${ctx.user.id} ORDER BY isFree DESC, providerName ASC`);
        const list = (rows as any[])[0] || [];
        if (list.length === 0) {
          for (const p of DEFAULT_PROVIDERS) {
            await db.execute(sqlRaw`INSERT INTO modelProviders (userId, providerKey, providerName, isFree, enabled, models) VALUES (${ctx.user.id}, ${p.providerKey}, ${p.providerName}, ${p.isFree}, true, ${JSON.stringify(p.models)})`);
          }
          const seeded = await db.execute(sqlRaw`SELECT * FROM modelProviders WHERE userId = ${ctx.user.id} ORDER BY isFree DESC, providerName ASC`);
          return (seeded as any[])[0] || [];
        }
        return list.map((p: any) => ({ ...p, models: typeof p.models === 'string' ? JSON.parse(p.models) : p.models, apiKey: p.apiKey ? '***已配置***' : null }));
      } catch { return DEFAULT_PROVIDERS.map((p, i) => ({ ...p, id: i + 1, userId: ctx.user.id, apiKey: null, createdAt: new Date(), updatedAt: new Date() })); }
    }),
    setApiKey: protectedProcedure.input(z.object({
      providerKey: z.string(),
      apiKey: z.string(),
      baseUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`UPDATE modelProviders SET apiKey = ${input.apiKey}, baseUrl = ${input.baseUrl || null}, enabled = true WHERE providerKey = ${input.providerKey} AND userId = ${ctx.user.id}`);
      return { success: true };
    }),
    toggle: protectedProcedure.input(z.object({ id: z.number(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql: sqlRaw } = await import('drizzle-orm');
      await db.execute(sqlRaw`UPDATE modelProviders SET enabled = ${input.enabled} WHERE id = ${input.id} AND userId = ${ctx.user.id}`);
      return { success: true };
    }),
  }),

  // ─── 对话历史 ───
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const { sql: sqlRaw } = await import('drizzle-orm');
        const rows = await db.execute(sqlRaw`SELECT * FROM conversations WHERE userId = ${ctx.user.id} ORDER BY updatedAt DESC LIMIT 20`);
        return (rows as any[])[0] || [];
      } catch { return []; }
    }),
    messages: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const { sql: sqlRaw } = await import('drizzle-orm');
        const rows = await db.execute(sqlRaw`SELECT * FROM messages WHERE conversationId = ${input.conversationId} AND userId = ${ctx.user.id} ORDER BY createdAt ASC`);
        return (rows as any[])[0] || [];
      } catch { return []; }
    }),
  }),

  // ─── GitHub 自动化工厂 ───
  github: router({
    createRepo: protectedProcedure.input(z.object({
      repoName: z.string().min(1),
      description: z.string().optional(),
      files: z.record(z.string(), z.string()),
      githubToken: z.string().min(1),
      org: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const nodeFetch = (await import('node-fetch')).default;
      const headers: Record<string, string> = {
        'Authorization': `token ${input.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };
      // Create repo
      const repoUrl = input.org
        ? `https://api.github.com/orgs/${input.org}/repos`
        : 'https://api.github.com/user/repos';
      const repoRes = await nodeFetch(repoUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: input.repoName, description: input.description || 'Generated by Agentic Factory OS', private: true, auto_init: true }),
      });
      if (!repoRes.ok) {
        const err = await repoRes.text();
        throw new Error(`GitHub 仓库创建失败: ${err}`);
      }
      const repoData = await repoRes.json() as any;
      const owner = input.org || repoData.owner?.login;
      // Push files
      for (const [path, content] of Object.entries(input.files)) {
        const fileUrl = `https://api.github.com/repos/${owner}/${input.repoName}/contents/${path}`;
        const encoded = Buffer.from(content as string).toString('base64');
        await nodeFetch(fileUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ message: `🤖 AI Generated: ${path}`, content: encoded }),
        });
      }
      return { success: true, repoUrl: repoData.html_url, repoName: input.repoName };
    }),
  }),

  // ─── Telegram 通知 ───
  telegram: router({
    send: protectedProcedure.input(z.object({
      chatId: z.string().min(1),
      message: z.string().min(1),
      botToken: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const nodeFetch2 = (await import('node-fetch')).default;
      const url = `https://api.telegram.org/bot${input.botToken}/sendMessage`;
      const res = await nodeFetch2(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: input.chatId, text: input.message, parse_mode: 'Markdown' }),
      });
      if (!res.ok) throw new Error('Telegram 发送失败');
      return { success: true };
    }),
  }),
});
