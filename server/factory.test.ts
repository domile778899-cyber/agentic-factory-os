import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB functions
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getProjectsByUser: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Test Project", slug: "test-project", status: "active", buildCount: 0, knowledgeBaseSize: 0, createdAt: new Date(), updatedAt: new Date() }
  ]),
  createProject: vi.fn().mockResolvedValue({ insertId: 2 }),
  getProjectById: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Test", slug: "test", status: "active", buildCount: 0, knowledgeBaseSize: 0, createdAt: new Date(), updatedAt: new Date() }),
  updateProject: vi.fn().mockResolvedValue(undefined),
  getBuildsByProject: vi.fn().mockResolvedValue([]),
  createBuild: vi.fn().mockResolvedValue({ insertId: 10 }),
  updateBuildStatus: vi.fn().mockResolvedValue(undefined),
  addBuildLog: vi.fn().mockResolvedValue(undefined),
  getBuildLogs: vi.fn().mockResolvedValue([]),
  getAgentsByUser: vi.fn().mockResolvedValue([]),
  upsertAgents: vi.fn().mockResolvedValue(undefined),
  updateAgentStatus: vi.fn().mockResolvedValue(undefined),
  getLatestEvolutionCycle: vi.fn().mockResolvedValue(null),
  createEvolutionCycle: vi.fn().mockResolvedValue({ id: 1, userId: 1, status: "collecting", feedbackCount: 0, qualitySamples: 0, triggerThreshold: 1000, autoRollback: true, createdAt: new Date() }),
  updateEvolutionCycle: vi.fn().mockResolvedValue(undefined),
  getBugReports: vi.fn().mockResolvedValue([]),
  createBugReport: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateBugReportStatus: vi.fn().mockResolvedValue(undefined),
  getFixProposals: vi.fn().mockResolvedValue([]),
  createFixProposal: vi.fn().mockResolvedValue({ insertId: 1 }),
  approveFixProposal: vi.fn().mockResolvedValue(undefined),
  getMoeConfigs: vi.fn().mockResolvedValue([]),
  upsertMoeConfig: vi.fn().mockResolvedValue(undefined),
  getSubscription: vi.fn().mockResolvedValue({ id: 1, userId: 1, tier: "free", buildsUsed: 0, buildsLimit: 2, createdAt: new Date(), updatedAt: new Date() }),
  upsertSubscription: vi.fn().mockResolvedValue(undefined),
  getEarnings: vi.fn().mockResolvedValue([]),
  addEarning: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"title":"Fix: test","description":"Auto fix","branchName":"fix/auto-123"}' } }]
  }),
}));

function createCtx(userId = 1): TrpcContext {
  return {
    user: { id: userId, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("auth", () => {
  it("returns current user", async () => {
    const ctx = createCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.id).toBe(1);
    expect(user?.name).toBe("Test User");
  });

  it("logout clears cookie", async () => {
    const ctx = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("projects", () => {
  it("lists projects for user", async () => {
    const caller = appRouter.createCaller(createCtx());
    const projects = await caller.projects.list();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects[0]?.name).toBe("Test Project");
  });

  it("creates a new project", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.projects.create({ name: "New Project", description: "Test" });
    expect(result).toBeDefined();
  });

  it("gets project by id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const project = await caller.projects.get({ id: 1 });
    expect(project?.id).toBe(1);
  });
});

describe("factory", () => {
  it("starts a build and returns buildId", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.factory.startBuild({ projectId: 1, prompt: "Build a test app" });
    expect(result.status).toBe("pending");
    expect(typeof result.buildId).toBe("number");
  });

  it("lists builds for project", async () => {
    const caller = appRouter.createCaller(createCtx());
    const builds = await caller.factory.builds({ projectId: 1 });
    expect(Array.isArray(builds)).toBe(true);
  });
});

describe("agents", () => {
  it("lists agents (seeds defaults if empty)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const agents = await caller.agents.list();
    expect(Array.isArray(agents)).toBe(true);
  });
});

describe("evolution", () => {
  it("starts an evolution cycle", async () => {
    const caller = appRouter.createCaller(createCtx());
    const cycle = await caller.evolution.start();
    expect(cycle).toBeDefined();
    expect((cycle as any).status).toBe("collecting");
  });
});

describe("subscription", () => {
  it("gets subscription plan", async () => {
    const caller = appRouter.createCaller(createCtx());
    const sub = await caller.subscription.get();
    expect(sub?.tier).toBe("free");
    expect(sub?.buildsLimit).toBe(2);
  });

  it("upgrades subscription tier", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.subscription.upgrade({ tier: "pro" });
    expect(result.success).toBe(true);
  });
});

describe("moe", () => {
  it("routes task to appropriate model", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.moe.route({ taskType: "code", prompt: "Write a function" });
    expect(result.selectedModel).toBeDefined();
    expect(typeof result.selectedModel).toBe("string");
  });
});
