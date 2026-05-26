import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, projects, builds, buildLogs, agents,
  evolutionCycles, bugReports, fixProposals, moeConfigs,
  subscriptions, earnings,
  InsertUser
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (e) { console.warn("[DB] connect failed:", e); }
  }
  return _db;
}

/* ─── Users ─── */
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const f of ["name","email","loginMethod"] as const) {
    if (user[f] !== undefined) { values[f] = user[f] ?? null; updateSet[f] = user[f] ?? null; }
  }
  if (user.lastSignedIn) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}

/* ─── Projects ─── */
export async function getProjectsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function createProject(data: { userId: number; name: string; description?: string; slug: string }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(projects).values({ ...data, status: 'active', buildCount: 0, knowledgeBaseSize: 0 });
  return r;
}

export async function getProjectById(id: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId))).limit(1);
  return r[0];
}

export async function updateProject(id: number, userId: number, data: Partial<{ name: string; description: string; status: 'active'|'archived'|'building' }>) {
  const db = await getDb(); if (!db) return;
  await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

/* ─── Builds ─── */
export async function getBuildsByProject(projectId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(builds).where(and(eq(builds.projectId, projectId), eq(builds.userId, userId))).orderBy(desc(builds.createdAt)).limit(20);
}

export async function createBuild(data: { projectId: number; userId: number; prompt: string }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(builds).values({ ...data, status: 'pending' });
  return r;
}

export async function updateBuildStatus(id: number, status: 'pending'|'running'|'success'|'failed'|'cancelled', extra?: Partial<{ durationMs: number; tokensUsed: number; githubPrUrl: string; agentsUsed: unknown; outputFiles: unknown }>) {
  const db = await getDb(); if (!db) return;
  await db.update(builds).set({ status, ...extra }).where(eq(builds.id, id));
}

export async function addBuildLog(data: { buildId: number; level: 'info'|'warn'|'error'|'step'|'success'; agentName?: string; message: string; metadata?: unknown }) {
  const db = await getDb(); if (!db) return;
  await db.insert(buildLogs).values(data);
}

export async function getBuildLogs(buildId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(buildLogs).where(eq(buildLogs.buildId, buildId)).orderBy(buildLogs.createdAt);
}

/* ─── Agents ─── */
export async function getAgentsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(agents.agentKey);
}

export async function upsertAgents(userId: number, agentList: Array<{ agentKey: string; name: string; role: string; layer: string; enabled?: boolean; skillsEnabled?: unknown }>) {
  const db = await getDb(); if (!db) return;
  for (const a of agentList) {
    const existing = await db.select().from(agents).where(and(eq(agents.userId, userId), eq(agents.agentKey, a.agentKey))).limit(1);
    if (existing.length === 0) {
      await db.insert(agents).values({ userId, ...a, status: 'online', tasksCompleted: 0 });
    }
  }
}

export async function updateAgentStatus(id: number, userId: number, data: Partial<{ enabled: boolean; status: 'online'|'busy'|'offline'; skillsEnabled: unknown }>) {
  const db = await getDb(); if (!db) return;
  await db.update(agents).set(data).where(and(eq(agents.id, id), eq(agents.userId, userId)));
}

/* ─── Evolution Cycles ─── */
export async function getLatestEvolutionCycle(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(evolutionCycles).where(eq(evolutionCycles.userId, userId)).orderBy(desc(evolutionCycles.createdAt)).limit(1);
  return r[0];
}

export async function createEvolutionCycle(userId: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(evolutionCycles).values({ userId, status: 'collecting', feedbackCount: 0, qualitySamples: 0, triggerThreshold: 1000, autoRollback: true });
  return r;
}

export async function updateEvolutionCycle(id: number, data: Partial<{ status: string; feedbackCount: number; qualitySamples: number; loraVersion: string; evalScore: number; baselineScore: number; startedAt: Date; completedAt: Date }>) {
  const db = await getDb(); if (!db) return;
  await db.update(evolutionCycles).set(data as any).where(eq(evolutionCycles.id, id));
}

/* ─── Bug Reports ─── */
export async function getBugReports(projectId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bugReports).where(and(eq(bugReports.projectId, projectId), eq(bugReports.userId, userId))).orderBy(desc(bugReports.createdAt));
}

export async function createBugReport(data: { projectId: number; userId: number; severity: 'critical'|'high'|'medium'|'low'; category: string; file: string; line?: number; description: string; suggestion?: string }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(bugReports).values({ ...data, status: 'open' });
  return r;
}

export async function updateBugReportStatus(id: number, userId: number, status: 'open'|'fixing'|'fixed'|'dismissed') {
  const db = await getDb(); if (!db) return;
  await db.update(bugReports).set({ status }).where(and(eq(bugReports.id, id), eq(bugReports.userId, userId)));
}

/* ─── Fix Proposals ─── */
export async function getFixProposals(projectId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(fixProposals).where(and(eq(fixProposals.projectId, projectId), eq(fixProposals.userId, userId))).orderBy(desc(fixProposals.createdAt));
}

export async function createFixProposal(data: { bugReportId: number; projectId: number; userId: number; title: string; description?: string; diff?: string; branchName?: string }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(fixProposals).values({ ...data, status: 'pending' });
  return r;
}

export async function approveFixProposal(id: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(fixProposals).set({ status: 'approved', approvedAt: new Date() }).where(and(eq(fixProposals.id, id), eq(fixProposals.userId, userId)));
}

/* ─── MoE Configs ─── */
export async function getMoeConfigs(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(moeConfigs).where(eq(moeConfigs.userId, userId)).orderBy(desc(moeConfigs.priority));
}

export async function upsertMoeConfig(userId: number, data: { modelKey: string; modelName: string; provider: string; enabled?: boolean; taskTypes?: unknown; priority?: number; costPerMToken?: number; maxContextWindow?: number }) {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(moeConfigs).where(and(eq(moeConfigs.userId, userId), eq(moeConfigs.modelKey, data.modelKey))).limit(1);
  if (existing.length === 0) {
    await db.insert(moeConfigs).values({ userId, ...data });
  } else {
    await db.update(moeConfigs).set(data).where(and(eq(moeConfigs.userId, userId), eq(moeConfigs.modelKey, data.modelKey)));
  }
}

/* ─── Subscriptions ─── */
export async function getSubscription(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return r[0];
}

export async function upsertSubscription(userId: number, tier: 'free'|'pro'|'team'|'enterprise') {
  const db = await getDb(); if (!db) return;
  const limits = { free: 2, pro: 20, team: 60, enterprise: 9999 };
  const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(subscriptions).values({ userId, tier, buildsUsed: 0, buildsLimit: limits[tier] });
  } else {
    await db.update(subscriptions).set({ tier, buildsLimit: limits[tier] }).where(eq(subscriptions.userId, userId));
  }
}

/* ─── Earnings ─── */
export async function getEarnings(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(earnings).where(eq(earnings.userId, userId)).orderBy(desc(earnings.createdAt)).limit(50);
}

export async function addEarning(data: { userId: number; type: 'subscription'|'compute_share'|'bazaar'|'referral'|'trading'; amountCents: number; description?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(earnings).values({ ...data, status: 'pending' });
}
