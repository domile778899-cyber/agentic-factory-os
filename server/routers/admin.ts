/**
 * 管理后台路由
 * 仅 admin 角色可访问
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ─── 数据看板 ───
  dashboard: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { users: 0, builds: 0, revenue: 0, activeUsers: 0, buildsByDay: [], revenueByType: {} };
    const { sql } = await import('drizzle-orm');
    try {
      const [usersRow] = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      const [buildsRow] = await db.execute(sql`SELECT COUNT(*) as count FROM builds`);
      const [revenueRow] = await db.execute(sql`SELECT COALESCE(SUM(amountCents), 0) as total FROM earnings WHERE status = 'confirmed'`);
      const [activeRow] = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE lastSignedIn > DATE_SUB(NOW(), INTERVAL 7 DAY)`);
      const [buildsByDay] = await db.execute(sql`SELECT DATE(createdAt) as date, COUNT(*) as count FROM builds WHERE createdAt > DATE_SUB(NOW(), INTERVAL 14 DAY) GROUP BY DATE(createdAt) ORDER BY date ASC`);
      const [tierDist] = await db.execute(sql`SELECT subscriptionTier, COUNT(*) as count FROM users GROUP BY subscriptionTier`);
      const [recentBuilds] = await db.execute(sql`SELECT b.id, b.prompt, b.status, b.createdAt, u.name as userName FROM builds b LEFT JOIN users u ON b.userId = u.id ORDER BY b.createdAt DESC LIMIT 10`);
      return {
        users: (usersRow as unknown as any[])[0]?.count || 0,
        builds: (buildsRow as unknown as any[])[0]?.count || 0,
        revenue: Math.round(((revenueRow as unknown as any[])[0]?.total || 0) / 100),
        activeUsers: (activeRow as unknown as any[])[0]?.count || 0,
        buildsByDay: (buildsByDay as unknown as any[]) || [],
        tierDistribution: (tierDist as unknown as any[]) || [],
        recentBuilds: (recentBuilds as unknown as any[]) || [],
      };
    } catch { return { users: 0, builds: 0, revenue: 0, activeUsers: 0, buildsByDay: [], tierDistribution: [], recentBuilds: [] }; }
  }),

  // ─── 用户管理 ───
  users: router({
    list: adminProcedure.input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { list: [], total: 0 };
      const { sql } = await import('drizzle-orm');
      try {
        const offset = (input.page - 1) * input.pageSize;
        const searchCond = input.search ? `AND (name LIKE '%${input.search}%' OR email LIKE '%${input.search}%')` : '';
        const [rows] = await db.execute(sql.raw(`SELECT u.*, s.tier as subTier, s.buildsUsed, s.buildsLimit FROM users u LEFT JOIN subscriptions s ON u.id = s.userId WHERE 1=1 ${searchCond} ORDER BY u.createdAt DESC LIMIT ${input.pageSize} OFFSET ${offset}`));
        const [countRow] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM users WHERE 1=1 ${searchCond}`));
        return { list: (rows as unknown as any[]) || [], total: (countRow as unknown as any[])[0]?.total || 0 };
      } catch { return { list: [], total: 0 }; }
    }),
    setRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(['user', 'admin']) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE users SET role = ${input.role} WHERE id = ${input.userId}`);
      return { success: true };
    }),
    setSubscription: adminProcedure.input(z.object({
      userId: z.number(),
      tier: z.enum(['free', 'pro', 'team', 'enterprise']),
      buildsLimit: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      const limits: Record<string, number> = { free: 2, pro: 20, team: 60, enterprise: 9999 };
      const limit = input.buildsLimit ?? limits[input.tier];
      await db.execute(sql`INSERT INTO subscriptions (userId, tier, buildsUsed, buildsLimit) VALUES (${input.userId}, ${input.tier}, 0, ${limit}) ON DUPLICATE KEY UPDATE tier = ${input.tier}, buildsLimit = ${limit}`);
      await db.execute(sql`UPDATE users SET subscriptionTier = ${input.tier} WHERE id = ${input.userId}`);
      return { success: true };
    }),
    addCredits: adminProcedure.input(z.object({
      userId: z.number(),
      builds: z.number().min(1),
      note: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE subscriptions SET buildsLimit = buildsLimit + ${input.builds} WHERE userId = ${input.userId}`);
      // Log as earning
      await db.execute(sql`INSERT INTO earnings (userId, type, amountCents, description, status) VALUES (${input.userId}, 'subscription', 0, ${input.note || `管理员手动增加 ${input.builds} 次构建额度`}, 'confirmed')`);
      return { success: true };
    }),
  }),

  // ─── 系统设置 ───
  settings: router({
    list: adminProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { sql } = await import('drizzle-orm');
      const [rows] = await db.execute(sql`SELECT * FROM adminSettings ORDER BY category, settingKey`);
      return (rows as unknown as any[]).map((r: any) => ({
        ...r,
        settingValue: r.settingType === 'secret' && r.settingValue ? '***已配置***' : r.settingValue,
      }));
    }),
    update: adminProcedure.input(z.object({
      settingKey: z.string(),
      settingValue: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE adminSettings SET settingValue = ${input.settingValue} WHERE settingKey = ${input.settingKey}`);
      return { success: true };
    }),
    batchUpdate: adminProcedure.input(z.array(z.object({
      settingKey: z.string(),
      settingValue: z.string(),
    }))).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      for (const item of input) {
        await db.execute(sql`UPDATE adminSettings SET settingValue = ${item.settingValue} WHERE settingKey = ${item.settingKey}`);
      }
      return { success: true };
    }),
    getRaw: adminProcedure.input(z.object({ settingKey: z.string() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { value: '' };
      const { sql } = await import('drizzle-orm');
      const [rows] = await db.execute(sql`SELECT settingValue FROM adminSettings WHERE settingKey = ${input.settingKey}`);
      return { value: (rows as unknown as any[])[0]?.settingValue || '' };
    }),
  }),

  // ─── 公告管理 ───
  announcements: router({
    list: adminProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { sql } = await import('drizzle-orm');
      const [rows] = await db.execute(sql`SELECT * FROM announcements ORDER BY createdAt DESC`);
      return (rows as unknown as any[]) || [];
    }),
    create: adminProcedure.input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`INSERT INTO announcements (title, content, type, isActive) VALUES (${input.title}, ${input.content}, ${input.type}, true)`);
      return { success: true };
    }),
    toggle: adminProcedure.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE announcements SET isActive = ${input.isActive} WHERE id = ${input.id}`);
      return { success: true };
    }),
  }),

  // ─── 构建监控 ───
  builds: router({
    list: adminProcedure.input(z.object({
      page: z.number().default(1),
      status: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { list: [], total: 0 };
      const { sql } = await import('drizzle-orm');
      try {
        const offset = (input.page - 1) * 20;
        const statusCond = input.status ? `AND b.status = '${input.status}'` : '';
        const [rows] = await db.execute(sql.raw(`SELECT b.*, u.name as userName, u.email as userEmail FROM builds b LEFT JOIN users u ON b.userId = u.id WHERE 1=1 ${statusCond} ORDER BY b.createdAt DESC LIMIT 20 OFFSET ${offset}`));
        const [countRow] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM builds WHERE 1=1 ${statusCond}`));
        return { list: (rows as unknown as any[]) || [], total: (countRow as unknown as any[])[0]?.total || 0 };
      } catch { return { list: [], total: 0 }; }
    }),
  }),

  // ─── 支付订单 ───
  orders: router({
    list: adminProcedure.input(z.object({ page: z.number().default(1) })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { list: [], total: 0 };
      const { sql } = await import('drizzle-orm');
      try {
        const offset = (input.page - 1) * 20;
        const [rows] = await db.execute(sql.raw(`SELECT o.*, u.name as userName, u.email as userEmail FROM paymentOrders o LEFT JOIN users u ON o.userId = u.id ORDER BY o.createdAt DESC LIMIT 20 OFFSET ${offset}`));
        const [countRow] = await db.execute(sql`SELECT COUNT(*) as total FROM paymentOrders`);
        return { list: (rows as unknown as any[]) || [], total: (countRow as unknown as any[])[0]?.total || 0 };
      } catch { return { list: [], total: 0 }; }
    }),
    manualPay: adminProcedure.input(z.object({
      userId: z.number(),
      tier: z.enum(['pro', 'team', 'enterprise']),
      amountCents: z.number(),
      note: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      const orderId = `MANUAL-${Date.now()}-${input.userId}`;
      await db.execute(sql`INSERT INTO paymentOrders (userId, orderId, amount, tier, status, paymentMethod) VALUES (${input.userId}, ${orderId}, ${input.amountCents}, ${input.tier}, 'paid', 'manual')`);
      const limits: Record<string, number> = { pro: 20, team: 60, enterprise: 9999 };
      await db.execute(sql`INSERT INTO subscriptions (userId, tier, buildsUsed, buildsLimit) VALUES (${input.userId}, ${input.tier}, 0, ${limits[input.tier]}) ON DUPLICATE KEY UPDATE tier = ${input.tier}, buildsLimit = ${limits[input.tier]}`);
      await db.execute(sql`UPDATE users SET subscriptionTier = ${input.tier} WHERE id = ${input.userId}`);
      await db.execute(sql`INSERT INTO earnings (userId, type, amountCents, description, status) VALUES (${input.userId}, 'subscription', ${input.amountCents}, ${input.note || `手动开通 ${input.tier} 套餐`}, 'confirmed')`);
      return { success: true, orderId };
    }),
  }),
});
