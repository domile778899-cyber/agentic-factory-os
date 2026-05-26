import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, projects, builds, buildLogs, agents,
  evolutionCycles, bugReports, fixProposals, moeConfigs,
  subscriptions, earnings,
  assistants, skills, userSkills, mcpServers, modelProviders,
  conversations, messages, taskOrders, communityPosts,
  communityComments, userIncomePlans, paymentEscrow,
  adminSettings, announcements,
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


/* ═══════════════════════════════════════════════════════════
   新增辅助函数 (2024)
   ═══════════════════════════════════════════════════════════ */

/* ─── Assistants ─── */
export async function getAssistantsByUser(userId: number, includePublic = false) {
  const db = await getDb(); if (!db) return [];
  if (includePublic) {
    return db.select().from(assistants).where(eq(assistants.userId, userId)).orderBy(desc(assistants.updatedAt));
  }
  return db.select().from(assistants).where(eq(assistants.userId, userId)).orderBy(desc(assistants.updatedAt));
}

export async function createAssistant(data: { userId: number; name: string; description?: string; systemPrompt?: string; model?: string; provider?: string; tags?: unknown; isPublic?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(assistants).values({ ...data, usageCount: 0 });
  return r;
}

export async function updateAssistant(id: number, userId: number, data: Partial<{ name: string; description: string; systemPrompt: string; model: string; provider: string; tags: unknown; isPublic: boolean }>) {
  const db = await getDb(); if (!db) return;
  await db.update(assistants).set(data).where(and(eq(assistants.id, id), eq(assistants.userId, userId)));
}

/* ─── Skills ─── */
export async function getSkills(category?: string) {
  const db = await getDb(); if (!db) return [];
  if (category) {
    return db.select().from(skills).where(eq(skills.category, category)).orderBy(desc(skills.downloadCount));
  }
  return db.select().from(skills).orderBy(desc(skills.downloadCount));
}

export async function createSkill(data: { name: string; description?: string; category: string; icon?: string; author?: string; isBuiltin?: boolean; config?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(skills).values({ ...data, downloadCount: 0, rating: 0 });
  return r;
}

/* ─── UserSkills ─── */
export async function getUserSkills(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(userSkills).where(eq(userSkills.userId, userId)).orderBy(desc(userSkills.installedAt));
}

export async function installSkill(userId: number, skillId: number, config?: unknown) {
  const db = await getDb(); if (!db) return;
  await db.insert(userSkills).values({ userId, skillId, config });
}

export async function uninstallSkill(userId: number, skillId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(userSkills).where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
}

/* ─── MCP Servers ─── */
export async function getMcpServersByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(mcpServers).where(eq(mcpServers.userId, userId)).orderBy(desc(mcpServers.updatedAt));
}

export async function createMcpServer(data: { userId: number; name: string; description?: string; endpoint?: string; transport?: string; config?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(mcpServers).values({ ...data, status: 'offline', toolsCount: 0, callsCount: 0 });
  return r;
}

export async function updateMcpServerStatus(id: number, userId: number, status: 'online'|'offline'|'error', toolsCount?: number) {
  const db = await getDb(); if (!db) return;
  await db.update(mcpServers).set({ status, ...(toolsCount !== undefined ? { toolsCount } : {}) }).where(and(eq(mcpServers.id, id), eq(mcpServers.userId, userId)));
}

/* ─── Model Providers ─── */
export async function getModelProvidersByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(modelProviders).where(eq(modelProviders.userId, userId)).orderBy(desc(modelProviders.updatedAt));
}

export async function upsertModelProvider(userId: number, data: { providerKey: string; providerName: string; isFree?: boolean; enabled?: boolean; apiKey?: string; baseUrl?: string; models?: unknown }) {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(modelProviders).where(and(eq(modelProviders.userId, userId), eq(modelProviders.providerKey, data.providerKey))).limit(1);
  if (existing.length === 0) {
    await db.insert(modelProviders).values({ userId, ...data });
  } else {
    await db.update(modelProviders).set(data).where(and(eq(modelProviders.userId, userId), eq(modelProviders.providerKey, data.providerKey)));
  }
}

/* ─── Conversations ─── */
export async function getConversationsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function createConversation(data: { userId: number; assistantId?: number; title?: string; model?: string; provider?: string }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(conversations).values({ ...data, messageCount: 0 });
  return r;
}

export async function incrementMessageCount(conversationId: number) {
  const db = await getDb(); if (!db) return;
  const conv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (conv[0]) {
    await db.update(conversations).set({ messageCount: conv[0].messageCount + 1 }).where(eq(conversations.id, conversationId));
  }
}

/* ─── Messages ─── */
export async function getMessagesByConversation(conversationId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

export async function createMessage(data: { conversationId: number; role: 'user'|'assistant'|'system'; content: string; tokensUsed?: number }) {
  const db = await getDb(); if (!db) return;
  await db.insert(messages).values(data);
}

/* ─── Task Orders ─── */
export async function getTaskOrders(status?: 'open'|'in_progress'|'completed'|'cancelled') {
  const db = await getDb(); if (!db) return [];
  if (status) {
    return db.select().from(taskOrders).where(eq(taskOrders.status, status)).orderBy(desc(taskOrders.createdAt));
  }
  return db.select().from(taskOrders).orderBy(desc(taskOrders.createdAt));
}

export async function getTaskOrdersByPublisher(publisherId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(taskOrders).where(eq(taskOrders.publisherId, publisherId)).orderBy(desc(taskOrders.createdAt));
}

export async function createTaskOrder(data: { publisherId: number; title: string; description?: string; category: string; budget?: number; currency?: string; deadline?: Date; requiredSkills?: unknown; attachments?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(taskOrders).values({ ...data, status: 'open' });
  return r;
}

export async function updateTaskOrderStatus(id: number, status: 'open'|'in_progress'|'completed'|'cancelled', takerId?: number) {
  const db = await getDb(); if (!db) return;
  const update: Record<string, unknown> = { status };
  if (status === 'completed') update.completedAt = new Date();
  if (takerId !== undefined) update.takerId = takerId;
  await db.update(taskOrders).set(update).where(eq(taskOrders.id, id));
}

/* ─── Community Posts ─── */
export async function getCommunityPosts(category?: string) {
  const db = await getDb(); if (!db) return [];
  if (category) {
    return db.select().from(communityPosts).where(eq(communityPosts.category, category)).orderBy(desc(communityPosts.createdAt));
  }
  return db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
}

export async function createCommunityPost(data: { userId: number; title: string; content: string; category: string; income?: number; tags?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(communityPosts).values({ ...data, likeCount: 0, commentCount: 0, isPinned: false });
  return r;
}

export async function incrementPostComments(postId: number) {
  const db = await getDb(); if (!db) return;
  const post = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (post[0]) {
    await db.update(communityPosts).set({ commentCount: post[0].commentCount + 1 }).where(eq(communityPosts.id, postId));
  }
}

/* ─── Community Comments ─── */
export async function getCommentsByPost(postId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(communityComments).where(eq(communityComments.postId, postId)).orderBy(communityComments.createdAt);
}

export async function createCommunityComment(data: { postId: number; userId: number; content: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(communityComments).values({ ...data, likeCount: 0 });
}

/* ─── User Income Plans ─── */
export async function getUserIncomePlans(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(userIncomePlans).where(eq(userIncomePlans.userId, userId)).orderBy(desc(userIncomePlans.createdAt));
}

export async function createUserIncomePlan(data: { userId: number; title: string; strategy?: unknown; expectedIncome?: number; timeline?: string }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(userIncomePlans).values({ ...data, status: 'draft' });
  return r;
}

export async function updateIncomePlanStatus(id: number, userId: number, status: 'draft'|'active'|'paused'|'completed') {
  const db = await getDb(); if (!db) return;
  await db.update(userIncomePlans).set({ status }).where(and(eq(userIncomePlans.id, id), eq(userIncomePlans.userId, userId)));
}

/* ─── Payment Escrow ─── */
export async function getPaymentEscrow(taskOrderId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(paymentEscrow).where(eq(paymentEscrow.taskOrderId, taskOrderId)).limit(1);
  return r[0];
}

export async function createPaymentEscrow(data: { taskOrderId: number; payerId: number; payeeId: number; amount: number; currency?: string; paymentMethod?: string; platformFeePercent?: number; platformFeeCents?: number; payeeAmountCents?: number }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(paymentEscrow).values({ ...data, status: 'pending' });
  return r;
}

export async function updateEscrowStatus(id: number, status: 'pending'|'held'|'released'|'disputed'|'refunded', extra?: { heldAt?: Date; releasedAt?: Date; disputeReason?: string }) {
  const db = await getDb(); if (!db) return;
  const update: Record<string, unknown> = { status, ...extra };
  if (status === 'held') update.heldAt = new Date();
  if (status === 'released') update.releasedAt = new Date();
  await db.update(paymentEscrow).set(update).where(eq(paymentEscrow.id, id));
}

/* ─── Admin Settings ─── */
export async function getAdminSetting(key: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(adminSettings).where(eq(adminSettings.key, key)).limit(1);
  return r[0];
}

export async function setAdminSetting(key: string, value: string, updatedBy: number) {
  const db = await getDb(); if (!db) return;
  await db.insert(adminSettings).values({ key, value, updatedBy }).onDuplicateKeyUpdate({ set: { value, updatedBy } });
}

/* ─── Announcements ─── */
export async function getActiveAnnouncements() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(data: { adminId: number; title: string; content: string; type?: 'info'|'warning'|'success'; startAt?: Date; endAt?: Date }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const [r] = await db.insert(announcements).values({ ...data, isActive: true });
  return r;
}

export async function deactivateAnnouncement(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(announcements).set({ isActive: false }).where(eq(announcements.id, id));
}
