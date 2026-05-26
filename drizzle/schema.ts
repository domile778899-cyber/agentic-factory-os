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
