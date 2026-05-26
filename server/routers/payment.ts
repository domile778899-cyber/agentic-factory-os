/**
 * 全球支付通道路由
 * 支持：Stripe（信用卡/全球）、支付宝、微信支付、PayPal、加密货币（USDT/ETH）、银行转账
 * 任务托管付款闭环：发布者预付款托管 → 接单者完成 → 平台自动结算（扣10%佣金）
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

// 支付方式配置
const PAYMENT_METHODS = [
  { key: 'stripe', name: 'Stripe 信用卡', icon: '💳', currencies: ['USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY'], global: true, feePercent: 2.9, feeFixed: 30, description: '支持全球 135+ 种货币，Visa/Mastercard/American Express' },
  { key: 'alipay', name: '支付宝', icon: '🔵', currencies: ['CNY', 'USD', 'EUR', 'HKD'], global: false, feePercent: 0.6, feeFixed: 0, description: '中国最广泛使用的支付方式，支持花呗分期' },
  { key: 'wechat', name: '微信支付', icon: '🟢', currencies: ['CNY'], global: false, feePercent: 0.6, feeFixed: 0, description: '微信生态内无缝支付，支持小程序/H5/Native' },
  { key: 'paypal', name: 'PayPal', icon: '🔷', currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'], global: true, feePercent: 3.49, feeFixed: 49, description: '全球最受信任的在线支付，支持200+国家' },
  { key: 'usdt', name: 'USDT (TRC20)', icon: '🪙', currencies: ['USDT'], global: true, feePercent: 0, feeFixed: 1, description: '稳定币支付，全球无边界，手续费极低' },
  { key: 'eth', name: 'ETH (以太坊)', icon: '⟠', currencies: ['ETH'], global: true, feePercent: 0, feeFixed: 0, description: '以太坊链上支付，去中心化，不可篡改' },
  { key: 'bank', name: '银行转账', icon: '🏦', currencies: ['CNY', 'USD', 'EUR'], global: true, feePercent: 0, feeFixed: 0, description: '企业级大额支付，支持国内外银行转账' },
];

export const paymentRouter = router({
  // ─── 获取支付方式列表 ───
  methods: publicProcedure.query(() => PAYMENT_METHODS),

  // ─── 创建托管支付订单 ───
  createEscrow: protectedProcedure.input(z.object({
    taskOrderId: z.number(),
    amount: z.number().min(1),
    currency: z.string().default('CNY'),
    paymentMethod: z.enum(['stripe', 'alipay', 'wechat', 'paypal', 'usdt', 'eth', 'bank']),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '数据库不可用' });
    const { sql } = await import('drizzle-orm');

    // 计算平台佣金（10%）
    const platformFeePercent = 10;
    const platformFeeCents = Math.round(input.amount * platformFeePercent / 100);
    const payeeAmountCents = input.amount - platformFeeCents;

    // 创建托管记录
    await db.execute(sql`INSERT INTO paymentEscrow (taskOrderId, payerId, amount, currency, status, paymentMethod, platformFeePercent, platformFeeCents, payeeAmountCents) VALUES (${input.taskOrderId}, ${ctx.user.id}, ${input.amount}, ${input.currency}, 'pending', ${input.paymentMethod}, ${platformFeePercent}, ${platformFeeCents}, ${payeeAmountCents})`);

    // 根据支付方式生成支付链接/二维码
    let paymentUrl = '';
    let qrCode = '';
    let instructions = '';

    switch (input.paymentMethod) {
      case 'stripe':
        // 实际使用时从 adminSettings 读取 Stripe Key 并创建 PaymentIntent
        paymentUrl = `/payment/stripe?amount=${input.amount}&currency=${input.currency}&taskId=${input.taskOrderId}`;
        instructions = '点击链接完成 Stripe 信用卡支付，支持 Visa/Mastercard/American Express';
        break;
      case 'alipay':
        paymentUrl = `alipays://platformapi/startapp?saId=10000007&qrcode=https://qr.alipay.com/demo&amount=${input.amount / 100}`;
        instructions = '请使用支付宝扫描二维码完成支付';
        break;
      case 'wechat':
        qrCode = `weixin://wxpay/bizpayurl?pr=demo&amount=${input.amount}`;
        instructions = '请使用微信扫描二维码完成支付';
        break;
      case 'paypal':
        paymentUrl = `https://www.paypal.com/checkoutnow?token=demo&amount=${input.amount / 100}`;
        instructions = '点击链接跳转 PayPal 完成支付';
        break;
      case 'usdt':
        instructions = `请向以下 USDT (TRC20) 地址转账 ${(input.amount / 100).toFixed(2)} USDT：\nTRx7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t\n转账后请联系客服确认`;
        break;
      case 'eth':
        instructions = `请向以下以太坊地址转账对应 ETH：\n0x742d35Cc6634C0532925a3b8D4C9C5e9d4b2c3f1\n转账后请联系客服确认`;
        break;
      case 'bank':
        instructions = `银行转账信息：\n开户行：招商银行上海分行\n账户名：AgenticFactory科技有限公司\n账号：6225880123456789\n金额：¥${(input.amount / 100).toFixed(2)}\n备注：任务${input.taskOrderId}`;
        break;
    }

    return {
      success: true,
      paymentUrl,
      qrCode,
      instructions,
      platformFeePercent,
      platformFeeCents,
      payeeAmountCents,
      escrowNote: `平台收取 ${platformFeePercent}% 服务费（¥${(platformFeeCents / 100).toFixed(2)}），接单者实得 ¥${(payeeAmountCents / 100).toFixed(2)}`,
    };
  }),

  // ─── 确认支付（模拟，实际由 Webhook 触发）───
  confirmPayment: protectedProcedure.input(z.object({
    taskOrderId: z.number(),
    transactionRef: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`UPDATE paymentEscrow SET status = 'held', heldAt = NOW() WHERE taskOrderId = ${input.taskOrderId} AND payerId = ${ctx.user.id}`);
    await db.execute(sql`UPDATE taskOrders SET status = 'in_progress' WHERE id = ${input.taskOrderId}`);
    return { success: true, message: '付款已托管，任务已开始！接单者完成后将自动结算。' };
  }),

  // ─── 释放托管款项（任务完成后）───
  releaseEscrow: protectedProcedure.input(z.object({
    taskOrderId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');

    // 验证是否为发布者
    const [rows] = await db.execute(sql`SELECT e.*, t.publisherId, t.takerId FROM paymentEscrow e JOIN taskOrders t ON e.taskOrderId = t.id WHERE e.taskOrderId = ${input.taskOrderId}`);
    const escrow = (rows as unknown as any[])[0];
    if (!escrow) throw new TRPCError({ code: 'NOT_FOUND', message: '托管记录不存在' });
    if (escrow.publisherId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: '只有发布者可以释放款项' });

    await db.execute(sql`UPDATE paymentEscrow SET status = 'released', releasedAt = NOW() WHERE taskOrderId = ${input.taskOrderId}`);
    await db.execute(sql`UPDATE taskOrders SET status = 'completed', completedAt = NOW() WHERE id = ${input.taskOrderId}`);

    // 记录接单者收益
    if (escrow.takerId) {
      await db.execute(sql`INSERT INTO earnings (userId, type, amountCents, description, status) VALUES (${escrow.takerId}, 'subscription', ${escrow.payeeAmountCents}, ${`任务#${input.taskOrderId} 完成结算（扣除${escrow.platformFeePercent}%平台服务费）`}, 'confirmed')`);
    }

    return { success: true, message: `款项已释放！接单者已收到 ¥${(escrow.payeeAmountCents / 100).toFixed(2)}` };
  }),

  // ─── 申请退款 ───
  requestRefund: protectedProcedure.input(z.object({
    taskOrderId: z.number(),
    reason: z.string().min(10),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`UPDATE paymentEscrow SET status = 'disputed', disputeReason = ${input.reason} WHERE taskOrderId = ${input.taskOrderId} AND payerId = ${ctx.user.id}`);
    return { success: true, message: '退款申请已提交，平台将在24小时内处理。' };
  }),

  // ─── 查询托管状态 ───
  escrowStatus: protectedProcedure.input(z.object({ taskOrderId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const { sql } = await import('drizzle-orm');
    const [rows] = await db.execute(sql`SELECT * FROM paymentEscrow WHERE taskOrderId = ${input.taskOrderId} AND (payerId = ${ctx.user.id} OR payeeId = ${ctx.user.id}) LIMIT 1`);
    return (rows as unknown as any[])[0] || null;
  }),

  // ─── 支付统计（管理员）───
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, held: 0, released: 0, platformRevenue: 0 };
    const { sql } = await import('drizzle-orm');
    try {
      const [rows] = await db.execute(sql`SELECT status, COUNT(*) as count, SUM(amount) as total, SUM(platformFeeCents) as fees FROM paymentEscrow GROUP BY status`);
      const data = (rows as unknown as any[]) || [];
      const stats = { total: 0, held: 0, released: 0, platformRevenue: 0 };
      data.forEach((r: any) => {
        stats.total += Number(r.total || 0);
        if (r.status === 'held') stats.held += Number(r.total || 0);
        if (r.status === 'released') stats.released += Number(r.total || 0);
        stats.platformRevenue += Number(r.fees || 0);
      });
      return stats;
    } catch { return { total: 0, held: 0, released: 0, platformRevenue: 0 }; }
  }),
});
