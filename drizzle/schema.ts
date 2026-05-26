import {
  int, mysqlEnum, mysqlTable, text, timestamp,
  varchar, boolean, json, bigint, float
} from "drizzle-orm/mysql-core";

/* ─── Users ─── */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro", "team", "enterprise"]).default("free").notNull(),
  locale: varchar("locale", { length: 8 }).default("zh").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/* ─── Projects (多租户) ─── */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["active", "archived", "building"]).default("active").notNull(),
  buildCount: int("buildCount").default(0).notNull(),
  knowledgeBaseSize: int("knowledgeBaseSize").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Builds (构建历史) ─── */
export const builds = mysqlTable("builds", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  prompt: text("prompt").notNull(),
  status: mysqlEnum("status", ["pending", "running", "success", "failed", "cancelled"]).default("pending").notNull(),
  agentsUsed: json("agentsUsed"),
  outputFiles: json("outputFiles"),
  githubPrUrl: text("githubPrUrl"),
  durationMs: int("durationMs"),
  tokensUsed: int("tokensUsed"),
  costCents: int("costCents").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Build Logs (SSE 日志) ─── */
export const buildLogs = mysqlTable("buildLogs", {
  id: int("id").autoincrement().primaryKey(),
  buildId: int("buildId").notNull(),
  level: mysqlEnum("level", ["info", "warn", "error", "step", "success"]).default("info").notNull(),
  agentName: varchar("agentName", { length: 64 }),
  message: text("message").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ─── Agents (14职业代理人) ─── */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentKey: varchar("agentKey", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  role: varchar("role", { length: 128 }).notNull(),
  layer: varchar("layer", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  status: mysqlEnum("status", ["online", "busy", "offline"]).default("online").notNull(),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  skillsEnabled: json("skillsEnabled"),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Evolution Cycles (自进化周期) ─── */
export const evolutionCycles = mysqlTable("evolutionCycles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["idle", "collecting", "training", "evaluating", "ab_testing", "deploying", "completed", "failed"]).default("idle").notNull(),
  feedbackCount: int("feedbackCount").default(0).notNull(),
  qualitySamples: int("qualitySamples").default(0).notNull(),
  loraVersion: varchar("loraVersion", { length: 64 }),
  evalScore: float("evalScore"),
  baselineScore: float("baselineScore"),
  abTestTraffic: int("abTestTraffic").default(10),
  triggerThreshold: int("triggerThreshold").default(1000).notNull(),
  autoRollback: boolean("autoRollback").default(true).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ─── Bug Reports (自愈扫描) ─── */
export const bugReports = mysqlTable("bugReports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  file: text("file").notNull(),
  line: int("line"),
  description: text("description").notNull(),
  suggestion: text("suggestion"),
  status: mysqlEnum("status", ["open", "fixing", "fixed", "dismissed"]).default("open").notNull(),
  fixProposalId: int("fixProposalId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Fix Proposals (自动修复PR) ─── */
export const fixProposals = mysqlTable("fixProposals", {
  id: int("id").autoincrement().primaryKey(),
  bugReportId: int("bugReportId").notNull(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  diff: text("diff"),
  branchName: varchar("branchName", { length: 128 }),
  prUrl: text("prUrl"),
  status: mysqlEnum("status", ["pending", "approved", "merged", "rejected"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── MoE Configs (多模型路由) ─── */
export const moeConfigs = mysqlTable("moeConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  modelKey: varchar("modelKey", { length: 64 }).notNull(),
  modelName: varchar("modelName", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  taskTypes: json("taskTypes"),
  priority: int("priority").default(0).notNull(),
  costPerMToken: float("costPerMToken").default(0),
  maxContextWindow: int("maxContextWindow").default(128000),
  apiEndpoint: text("apiEndpoint"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Subscriptions ─── */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tier: mysqlEnum("tier", ["free", "pro", "team", "enterprise"]).default("free").notNull(),
  buildsUsed: int("buildsUsed").default(0).notNull(),
  buildsLimit: int("buildsLimit").default(2).notNull(),
  renewsAt: timestamp("renewsAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Earnings (收益记录) ─── */
export const earnings = mysqlTable("earnings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["subscription", "compute_share", "bazaar", "referral", "trading"]).notNull(),
  amountCents: int("amountCents").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "confirmed", "withdrawn"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ─── Type exports ─── */
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type Build = typeof builds.$inferSelect;
export type BuildLog = typeof buildLogs.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type EvolutionCycle = typeof evolutionCycles.$inferSelect;
export type BugReport = typeof bugReports.$inferSelect;
export type FixProposal = typeof fixProposals.$inferSelect;
export type MoeConfig = typeof moeConfigs.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Earning = typeof earnings.$inferSelect;

/* ═══════════════════════════════════════════════════════════
   新增表定义 (2024)
   ═══════════════════════════════════════════════════════════ */

/* ─── Assistants (AI助理) ─── */
export const assistants = mysqlTable("assistants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  avatar: text("avatar"),
  description: text("description"),
  systemPrompt: text("systemPrompt"),
  model: varchar("model", { length: 64 }),
  provider: varchar("provider", { length: 64 }),
  temperature: float("temperature").default(0.7),
  maxTokens: int("maxTokens").default(2048),
  tags: json("tags"),
  isPublic: boolean("isPublic").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Skills (技能市场) ─── */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(),
  icon: text("icon"),
  author: varchar("author", { length: 128 }),
  isBuiltin: boolean("isBuiltin").default(false).notNull(),
  downloadCount: int("downloadCount").default(0).notNull(),
  rating: float("rating").default(0),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ─── UserSkills (用户已安装技能) ─── */
export const userSkills = mysqlTable("userSkills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: int("skillId").notNull(),
  installedAt: timestamp("installedAt").defaultNow().notNull(),
  config: json("config"),
});

/* ─── McpServers (MCP服务器配置) ─── */
export const mcpServers = mysqlTable("mcpServers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  endpoint: text("endpoint"),
  transport: varchar("transport", { length: 32 }).default("stdio").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  status: mysqlEnum("status", ["online", "offline", "error"]).default("offline").notNull(),
  toolsCount: int("toolsCount").default(0).notNull(),
  callsCount: int("callsCount").default(0).notNull(),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── ModelProviders (模型服务商) ─── */
export const modelProviders = mysqlTable("modelProviders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  providerKey: varchar("providerKey", { length: 64 }).notNull(),
  providerName: varchar("providerName", { length: 128 }).notNull(),
  isFree: boolean("isFree").default(false).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  apiKey: text("apiKey"),
  baseUrl: text("baseUrl"),
  models: json("models"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Conversations (对话历史) ─── */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assistantId: int("assistantId"),
  title: varchar("title", { length: 256 }),
  model: varchar("model", { length: 64 }),
  provider: varchar("provider", { length: 64 }),
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Messages (消息记录) ─── */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  tokensUsed: int("tokensUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ─── TaskOrders (任务订单) ─── */
export const taskOrders = mysqlTable("taskOrders", {
  id: int("id").autoincrement().primaryKey(),
  publisherId: int("publisherId").notNull(),
  takerId: int("takerId"),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(),
  budget: float("budget"),
  currency: varchar("currency", { length: 8 }).default("CNY").notNull(),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "cancelled"]).default("open").notNull(),
  requiredSkills: json("requiredSkills"),
  attachments: json("attachments"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── CommunityPosts (社区帖子) ─── */
export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  income: float("income"),
  tags: json("tags"),
  likeCount: int("likeCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── CommunityComments (社区评论) ─── */
export const communityComments = mysqlTable("communityComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── UserIncomePlans (用户收益计划) ─── */
export const userIncomePlans = mysqlTable("userIncomePlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  strategy: json("strategy"),
  expectedIncome: float("expectedIncome"),
  timeline: text("timeline"),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── PaymentEscrow (支付托管) ─── */
export const paymentEscrow = mysqlTable("paymentEscrow", {
  id: int("id").autoincrement().primaryKey(),
  taskOrderId: int("taskOrderId").notNull(),
  payerId: int("payerId").notNull(),
  payeeId: int("payeeId").notNull(),
  amount: float("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("CNY").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  status: mysqlEnum("status", ["pending", "held", "released", "disputed", "refunded"]).default("pending").notNull(),
  platformFeePercent: float("platformFeePercent").default(5),
  platformFeeCents: int("platformFeeCents").default(0),
  payeeAmountCents: int("payeeAmountCents").default(0),
  heldAt: timestamp("heldAt"),
  releasedAt: timestamp("releasedAt"),
  disputeReason: text("disputeReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ─── AdminSettings (管理后台配置) ─── */
export const adminSettings = mysqlTable("adminSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── Announcements (公告) ─── */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["info", "warning", "success"]).default("info").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ─── 新增表类型导出 ─── */
export type Assistant = typeof assistants.$inferSelect;
export type InsertAssistant = typeof assistants.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;
export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = typeof userSkills.$inferInsert;
export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = typeof mcpServers.$inferInsert;
export type ModelProvider = typeof modelProviders.$inferSelect;
export type InsertModelProvider = typeof modelProviders.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type TaskOrder = typeof taskOrders.$inferSelect;
export type InsertTaskOrder = typeof taskOrders.$inferInsert;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;
export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = typeof communityComments.$inferInsert;
export type UserIncomePlan = typeof userIncomePlans.$inferSelect;
export type InsertUserIncomePlan = typeof userIncomePlans.$inferInsert;
export type PaymentEscrow = typeof paymentEscrow.$inferSelect;
export type InsertPaymentEscrow = typeof paymentEscrow.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
