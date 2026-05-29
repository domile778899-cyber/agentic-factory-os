/**
 * 对话历史路由
 * - 对话 CRUD（创建/列表/删除/重命名）
 * - 消息持久化（保存/加载）
 * - 图片上传（base64 转 S3）
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";

export const chatHistoryRouter = router({
  // ─── 对话列表 ───
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { sql } = await import('drizzle-orm');
    const [rows] = await db.execute(sql`
      SELECT id, title, modelKey, messageCount, lastMessageAt, isPinned, createdAt
      FROM aiConversations
      WHERE userId = ${ctx.user.id}
      ORDER BY isPinned DESC, lastMessageAt DESC
      LIMIT 50
    `) as unknown as any[][];
    return (rows as any[]) || [];
  }),

  // ─── 创建新对话 ───
  create: protectedProcedure.input(z.object({
    title: z.string().default('新对话'),
    modelKey: z.string().default('deepseek-chat'),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { id: Date.now() };
    const { sql } = await import('drizzle-orm');
    const [result] = await db.execute(sql`
      INSERT INTO aiConversations (userId, title, modelKey) VALUES (${ctx.user.id}, ${input.title}, ${input.modelKey})
    `) as unknown as any[];
    return { id: (result as any).insertId };
  }),

  // ─── 重命名对话 ───
  rename: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).max(100),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`UPDATE aiConversations SET title = ${input.title} WHERE id = ${input.id} AND userId = ${ctx.user.id}`);
    return { success: true };
  }),

  // ─── 置顶/取消置顶 ───
  togglePin: protectedProcedure.input(z.object({
    id: z.number(),
    isPinned: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`UPDATE aiConversations SET isPinned = ${input.isPinned} WHERE id = ${input.id} AND userId = ${ctx.user.id}`);
    return { success: true };
  }),

  // ─── 删除对话 ───
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`DELETE FROM aiMessages WHERE conversationId = ${input.id} AND userId = ${ctx.user.id}`);
    await db.execute(sql`DELETE FROM aiConversations WHERE id = ${input.id} AND userId = ${ctx.user.id}`);
    return { success: true };
  }),

  // ─── 加载对话消息 ───
  messages: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const { sql } = await import('drizzle-orm');
    const [rows] = await db.execute(sql`
      SELECT id, role, content, imageUrls, modelKey, createdAt
      FROM aiMessages
      WHERE conversationId = ${input.conversationId} AND userId = ${ctx.user.id}
      ORDER BY createdAt ASC
      LIMIT 200
    `) as unknown as any[][];
    return (rows as any[]) || [];
  }),

  // ─── 保存消息 ───
  saveMessage: protectedProcedure.input(z.object({
    conversationId: z.number(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    imageUrls: z.array(z.string()).optional(),
    modelKey: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`
      INSERT INTO aiMessages (conversationId, userId, role, content, imageUrls, modelKey)
      VALUES (${input.conversationId}, ${ctx.user.id}, ${input.role}, ${input.content}, ${JSON.stringify(input.imageUrls || [])}, ${input.modelKey || null})
    `);
    // 更新对话的最后消息时间和消息数量
    await db.execute(sql`
      UPDATE aiConversations
      SET messageCount = messageCount + 1, lastMessageAt = NOW()
      WHERE id = ${input.conversationId} AND userId = ${ctx.user.id}
    `);
    // 如果是第一条用户消息，用它作为对话标题
    if (input.role === 'user') {
      const [countRow] = await db.execute(sql`
        SELECT messageCount FROM aiConversations WHERE id = ${input.conversationId}
      `) as unknown as any[][];
      const count = (countRow as any[])[0]?.messageCount || 0;
      if (count <= 2) {
        const title = input.content.slice(0, 50).replace(/\n/g, ' ');
        await db.execute(sql`UPDATE aiConversations SET title = ${title} WHERE id = ${input.conversationId} AND userId = ${ctx.user.id}`);
      }
    }
    return { success: true };
  }),

  // ─── 上传图片（base64 → S3）───
  uploadImage: protectedProcedure.input(z.object({
    base64: z.string(),
    mimeType: z.string().default('image/jpeg'),
    filename: z.string().default('image.jpg'),
  })).mutation(async ({ ctx, input }) => {
    // 将 base64 转为 Buffer
    const base64Data = input.base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const key = `ai-chat/${ctx.user.id}/${Date.now()}-${input.filename}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    return { url, key };
  }),
});
