/**
 * 赚錢社区路由
 * 包含：100+赚錢项目库、任务市场、社区帖子、AI收益计划生成器
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { MONEY_PROJECTS, PROJECT_CATEGORIES } from "../data/moneyProjects";

// ─── 示例任务订单 ───
const SAMPLE_TASKS = [
  { title: '需要一个AI客服机器人接入微信', category: 'agent', budget: 8000, description: '我们是一家电商公司，需要一个能接入微信客服的AI机器人，能回答产品问题、处理退换货咨询。要求：7x24小时在线，支持图片识别，能转人工。', requiredSkills: ['Python', 'WeChat API', 'ChatGPT API'], deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  { title: '帮我搭建YouTube无脸频道自动化系统', category: 'content', budget: 3000, description: '想做一个历史知识类YouTube无脸频道，需要帮我搭建：自动生成脚本→AI配音→自动剪辑→自动发布的完整流程。', requiredSkills: ['ElevenLabs', 'FFmpeg', 'YouTube API'], deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { title: '开发一个AI简历优化小程序', category: 'tech', budget: 15000, description: '需要开发微信小程序，用户上传简历后AI自动分析并给出优化建议，支持一键重写。需要后台管理系统。', requiredSkills: ['微信小程序', 'Node.js', 'ChatGPT API'], deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { title: '帮我做抖音AI数字人直播方案', category: 'content', budget: 5000, description: '想开一个抖音AI数字人直播带货账号，需要帮我选择合适的工具、搭建流程、培训操作。', requiredSkills: ['HeyGen', '抖音API', '直播运营'], deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { title: '需要100篇SEO优化文章', category: 'content', budget: 2000, description: '我的独立站需要100篇关于"宠物护理"的SEO优化文章，每篇1500字以上，需要包含关键词布局。', requiredSkills: ['ChatGPT', 'SEO', '内容创作'], deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
];

export const communityRouter = router({
  // ─── 赚钱项目库 ───
  projects: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      difficulty: z.string().optional(),
      search: z.string().optional(),
      isFree: z.boolean().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    })).query(async ({ input }) => {
      let filtered = MONEY_PROJECTS;
      if (input.category) filtered = filtered.filter(p => p.category === input.category);
      if (input.difficulty) filtered = filtered.filter(p => p.difficulty === input.difficulty);
      if (input.isFree !== undefined) filtered = filtered.filter(p => p.isFree === input.isFree);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tags as string[]).some(t => t.toLowerCase().includes(q)));
      }
      const start = (input.page - 1) * input.pageSize;
      return {
        list: filtered.slice(start, start + input.pageSize),
        total: filtered.length,
        categories: PROJECT_CATEGORIES.map(cat => ({
          key: cat.key,
          label: cat.label,
          icon: cat.icon,
          color: cat.color,
          count: MONEY_PROJECTS.filter(p => p.category === cat.key).length,
        })),
      };
    }),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
      return MONEY_PROJECTS.find(p => p.number === input.id) || null;
    }),
    hot: publicProcedure.query(() => MONEY_PROJECTS.filter(p => p.isHot).slice(0, 6)),
    stats: publicProcedure.query(() => ({
      total: MONEY_PROJECTS.length,
      freeCount: MONEY_PROJECTS.filter(p => p.isFree).length,
      categories: PROJECT_CATEGORIES.length,
      maxIncome: '¥100000+/月',
    })),
  }),

  // ─── 任务市场 ───
  tasks: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      status: z.string().optional(),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // Return sample data
        return SAMPLE_TASKS.map((t, i) => ({ ...t, id: i + 1, publisherId: 1, takerId: null, status: 'open', currency: 'CNY', attachments: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() }));
      }
      try {
        const { sql } = await import('drizzle-orm');
        const [rows] = await db.execute(sql`SELECT t.*, u.name as publisherName FROM taskOrders t LEFT JOIN users u ON t.publisherId = u.id WHERE t.status = 'open' ORDER BY t.createdAt DESC LIMIT 20`);
        const list = (rows as unknown as any[]) || [];
        if (list.length === 0) {
          // Seed sample tasks
          for (const task of SAMPLE_TASKS) {
            await db.execute(sql`INSERT INTO taskOrders (publisherId, title, description, category, budget, currency, deadline, status, requiredSkills) VALUES (1, ${task.title}, ${task.description}, ${task.category}, ${task.budget}, 'CNY', ${task.deadline}, 'open', ${JSON.stringify(task.requiredSkills)})`);
          }
          const [seeded] = await db.execute(sql`SELECT t.*, u.name as publisherName FROM taskOrders t LEFT JOIN users u ON t.publisherId = u.id WHERE t.status = 'open' ORDER BY t.createdAt DESC LIMIT 20`);
          return (seeded as unknown as any[]) || [];
        }
        return list;
      } catch { return SAMPLE_TASKS.map((t, i) => ({ ...t, id: i + 1, publisherId: 1, status: 'open', createdAt: new Date() })); }
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1).max(256),
      description: z.string().min(10),
      category: z.string(),
      budget: z.number().min(1),
      requiredSkills: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`INSERT INTO taskOrders (publisherId, title, description, category, budget, currency, status, requiredSkills) VALUES (${ctx.user.id}, ${input.title}, ${input.description}, ${input.category}, ${input.budget}, 'CNY', 'open', ${JSON.stringify(input.requiredSkills || [])})`);
      return { success: true };
    }),
    take: protectedProcedure.input(z.object({ taskId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE taskOrders SET takerId = ${ctx.user.id}, status = 'in_progress' WHERE id = ${input.taskId} AND status = 'open'`);
      return { success: true };
    }),
  }),

  // ─── 社区帖子 ───
  posts: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      page: z.number().default(1),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { list: [], total: 0 };
      try {
        const { sql } = await import('drizzle-orm');
        const offset = (input.page - 1) * 10;
        const catCond = input.category ? `AND p.category = '${input.category}'` : '';
        const [rows] = await db.execute(sql.raw(`SELECT p.*, u.name as authorName FROM communityPosts p LEFT JOIN users u ON p.userId = u.id WHERE 1=1 ${catCond} ORDER BY p.isPinned DESC, p.createdAt DESC LIMIT 10 OFFSET ${offset}`));
        const [countRow] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM communityPosts WHERE 1=1 ${catCond}`));
        return { list: (rows as unknown as any[]) || [], total: (countRow as unknown as any[])[0]?.total || 0 };
      } catch { return { list: [], total: 0 }; }
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1).max(256),
      content: z.string().min(10),
      category: z.string().default('share'),
      income: z.number().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`INSERT INTO communityPosts (userId, title, content, category, income, tags) VALUES (${ctx.user.id}, ${input.title}, ${input.content}, ${input.category}, ${input.income || 0}, ${JSON.stringify(input.tags || [])})`);
      return { success: true };
    }),
    like: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE communityPosts SET likeCount = likeCount + 1 WHERE id = ${input.postId}`);
      return { success: true };
    }),
  }),

  // ─── AI收益计划生成器 ───
  incomePlan: router({
    generate: protectedProcedure.input(z.object({
      targetMonthlyIncome: z.number().min(100),
      skills: z.array(z.string()),
      timeAvailable: z.string(),
      budget: z.string(),
      experience: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const projectList = MONEY_PROJECTS.slice(0, 20).map(p => `${p.number}. ${p.title}（${p.incomeRange}，难度:${p.difficulty}，${p.isFree ? '免费启动' : '需要投入'}）`).join('\n');
      const resp = await invokeLLM({
        messages: [
          { role: 'system', content: `你是一位专业的AI赚钱策略顾问。根据用户情况，从以下项目中推荐最适合的3-5个，并制定详细的行动计划。\n\n可选项目库：\n${projectList}` },
          { role: 'user', content: `我的情况：\n- 目标月收入：¥${input.targetMonthlyIncome}\n- 技能：${input.skills.join('、')}\n- 每天可用时间：${input.timeAvailable}\n- 启动资金：${input.budget}\n- 经验水平：${input.experience}\n\n请给我一个详细的赚钱计划，包括：推荐项目、启动步骤、预期时间线、注意事项。用中文回答，格式清晰。` },
        ],
      });
      const analysis = resp.choices[0]?.message?.content as string || '';
      // Save plan
      const db = await getDb();
      if (db) {
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`INSERT INTO userIncomePlans (userId, planName, targetMonthlyIncome, selectedProjects, aiAnalysis, estimatedDays, status) VALUES (${ctx.user.id}, ${`¥${input.targetMonthlyIncome}/月收益计划`}, ${input.targetMonthlyIncome}, ${JSON.stringify([])}, ${analysis}, 90, 'active')`);
      }
      return { analysis, planName: `¥${input.targetMonthlyIncome}/月收益计划` };
    }),
    myPlans: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { sql } = await import('drizzle-orm');
      const [rows] = await db.execute(sql`SELECT * FROM userIncomePlans WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC LIMIT 5`);
      return (rows as unknown as any[]) || [];
    }),
  }),

  // ─── 排行榜 ───
  leaderboard: publicProcedure.query(async () => {
    // Mock leaderboard data
    return [
      { rank: 1, name: '创业者小王', avatar: '👨‍💻', income: 85000, project: 'AI客服外包', badge: '🏆' },
      { rank: 2, name: '独立开发者李', avatar: '👩‍💻', income: 62000, project: 'AI SaaS产品', badge: '🥈' },
      { rank: 3, name: '内容创作者张', avatar: '🎨', income: 48000, project: '无脸YouTube', badge: '🥉' },
      { rank: 4, name: 'AI副业达人', avatar: '🚀', income: 35000, project: '提示词服务', badge: '⭐' },
      { rank: 5, name: '量化交易者陈', avatar: '📈', income: 28000, project: 'AI量化策略', badge: '⭐' },
      { rank: 6, name: '设计师小美', avatar: '🎭', income: 22000, project: 'AI海报设计', badge: '⭐' },
      { rank: 7, name: '电商运营者', avatar: '🛒', income: 18000, project: 'AI独立站', badge: '⭐' },
      { rank: 8, name: '教育博主', avatar: '📚', income: 15000, project: 'AI知识付费', badge: '⭐' },
    ];
  }),
});
