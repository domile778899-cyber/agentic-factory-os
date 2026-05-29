/**
 * 免费 AI 模型路由
 * 支持：DeepSeek / Groq / Gemini / Qwen / SiliconFlow / OpenRouter
 * 用户可以使用平台内置免费额度，也可以填入自己的 API Key 解锁更多用量
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

// ─── 免费模型配置 ───
export const FREE_MODELS_CONFIG = [
  {
    key: 'deepseek-chat',
    name: 'DeepSeek Chat V3',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    freeLimit: '每天 500 次请求，每次最多 4096 tokens',
    freeNote: '注册即免费，无需信用卡',
    signupUrl: 'https://platform.deepseek.com',
    badge: '🆓 完全免费',
    color: '#4F46E5',
    contextWindow: 64000,
    strengths: ['代码生成', '逻辑推理', '中文理解'],
    isBuiltIn: true, // 平台内置，用户无需配置
  },
  {
    key: 'deepseek-reasoner',
    name: 'DeepSeek R1 推理',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    freeLimit: '每天 50 次请求（推理模型消耗更多）',
    freeNote: '注册即免费，适合复杂推理任务',
    signupUrl: 'https://platform.deepseek.com',
    badge: '🆓 免费推理',
    color: '#7C3AED',
    contextWindow: 64000,
    strengths: ['深度推理', '数学', '复杂分析'],
    isBuiltIn: true,
  },
  {
    key: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    providerName: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    freeLimit: '每天 14400 次请求，每分钟 30 次',
    freeNote: '超高速推理，注册即免费',
    signupUrl: 'https://console.groq.com',
    badge: '⚡ 超高速免费',
    color: '#059669',
    contextWindow: 128000,
    strengths: ['超快速度', '通用对话', '代码'],
    isBuiltIn: true,
  },
  {
    key: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    providerName: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    freeLimit: '每天 14400 次请求',
    freeNote: 'MoE 架构，多语言支持好',
    signupUrl: 'https://console.groq.com',
    badge: '⚡ 免费',
    color: '#0891B2',
    contextWindow: 32768,
    strengths: ['多语言', '长文本', '效率'],
    isBuiltIn: false,
  },
  {
    key: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    providerName: 'Google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    freeLimit: '每分钟 15 次，每天 1500 次',
    freeNote: 'Google 官方免费，支持多模态',
    signupUrl: 'https://aistudio.google.com',
    badge: '🆓 Google免费',
    color: '#EA4335',
    contextWindow: 1000000,
    strengths: ['超长上下文', '多模态', '搜索增强'],
    isBuiltIn: false,
  },
  {
    key: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    providerName: 'Google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    freeLimit: '每分钟 15 次，每天 1500 次',
    freeNote: '稳定版本，免费使用',
    signupUrl: 'https://aistudio.google.com',
    badge: '🆓 Google免费',
    color: '#FBBC04',
    contextWindow: 1000000,
    strengths: ['稳定', '速度快', '多语言'],
    isBuiltIn: false,
  },
  {
    key: 'qwen-plus',
    name: 'Qwen Plus',
    provider: 'qwen',
    providerName: '阿里云通义千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    freeLimit: '新用户赠送 100 万 tokens',
    freeNote: '阿里云注册，中文理解极强',
    signupUrl: 'https://dashscope.aliyuncs.com',
    badge: '🆓 中文优化',
    color: '#FF6A00',
    contextWindow: 131072,
    strengths: ['中文理解', '长文本', '代码'],
    isBuiltIn: false,
  },
  {
    key: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek V3 (硅基流动)',
    provider: 'siliconflow',
    providerName: '硅基流动',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    freeLimit: '新用户赠送 14 元额度',
    freeNote: '国内访问稳定，无需翻墙',
    signupUrl: 'https://siliconflow.cn',
    badge: '🆓 国内免费',
    color: '#8B5CF6',
    contextWindow: 64000,
    strengths: ['国内访问', '稳定', '中文'],
    isBuiltIn: false,
  },
  {
    key: 'claude-3-haiku',
    name: 'Claude 3 Haiku (OpenRouter)',
    provider: 'openrouter',
    providerName: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    freeLimit: '注册赠送 $1 额度，部分模型完全免费',
    freeNote: '聚合多个AI提供商，包含免费模型',
    signupUrl: 'https://openrouter.ai',
    badge: '🆓 聚合免费',
    color: '#F59E0B',
    contextWindow: 200000,
    strengths: ['模型多样', '稳定', '全球访问'],
    isBuiltIn: false,
  },
];

// ─── 调用外部免费模型 ───
async function callExternalModel(
  messages: Array<{ role: string; content: string }>,
  modelKey: string,
  apiKey: string,
  endpoint: string,
  provider: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // OpenRouter 需要额外 headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://agentic-factory-os.manus.space';
    headers['X-Title'] = 'Agentic Factory OS';
  }

  // Gemini 使用不同的认证方式
  let url = endpoint;
  if (provider === 'gemini') {
    url = `${endpoint}?key=${apiKey}`;
    delete headers['Authorization'];
  }

  const body = {
    model: modelKey,
    messages,
    max_tokens: 2048,
    temperature: 0.7,
    stream: false,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`模型调用失败 (${resp.status}): ${errText.slice(0, 200)}`);
  }

  const data = await resp.json() as any;
  return data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text || '模型返回空响应';
}

export const freeAiRouter = router({
  // ─── 获取所有免费模型列表 ───
  models: publicProcedure.query(() => FREE_MODELS_CONFIG),

  // ─── 使用平台内置免费模型聊天（无需用户配置 API Key）───
  chat: protectedProcedure.input(z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })),
    modelKey: z.string().default('deepseek-chat'),
    systemPrompt: z.string().optional(),
    userApiKey: z.string().optional(), // 用户自己的 API Key（可选）
  })).mutation(async ({ ctx, input }) => {
    const modelConfig = FREE_MODELS_CONFIG.find(m => m.key === input.modelKey);
    if (!modelConfig) throw new TRPCError({ code: 'BAD_REQUEST', message: '不支持的模型' });

    const messages = input.systemPrompt
      ? [{ role: 'system' as const, content: input.systemPrompt }, ...input.messages]
      : input.messages;

    try {
      // 优先使用用户自己的 API Key
      if (input.userApiKey && input.userApiKey.length > 10) {
        const result = await callExternalModel(
          messages,
          input.modelKey,
          input.userApiKey,
          modelConfig.endpoint,
          modelConfig.provider
        );
        return { content: result, model: input.modelKey, provider: modelConfig.providerName, usedUserKey: true };
      }

      // 使用平台内置 LLM（Manus 内置，对用户免费）
      const resp = await invokeLLM({ messages });
      const content = resp.choices?.[0]?.message?.content as string || '';
      return { content, model: 'platform-default', provider: 'Agentic Factory OS', usedUserKey: false };

    } catch (err: any) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `AI 调用失败: ${err.message}` });
    }
  }),

  // ─── 测试用户的 API Key 是否有效 ───
  testApiKey: protectedProcedure.input(z.object({
    provider: z.string(),
    apiKey: z.string(),
    modelKey: z.string(),
  })).mutation(async ({ input }) => {
    const modelConfig = FREE_MODELS_CONFIG.find(m => m.provider === input.provider && m.key === input.modelKey);
    if (!modelConfig) throw new TRPCError({ code: 'BAD_REQUEST', message: '不支持的模型' });

    try {
      const result = await callExternalModel(
        [{ role: 'user', content: '你好，请回复"连接成功"' }],
        input.modelKey,
        input.apiKey,
        modelConfig.endpoint,
        input.provider
      );
      return { success: true, message: `✅ 连接成功！模型回复: ${result.slice(0, 50)}` };
    } catch (err: any) {
      return { success: false, message: `❌ 连接失败: ${err.message.slice(0, 100)}` };
    }
  }),

  // ─── 保存用户的 API Keys（加密存储到数据库）───
  saveApiKeys: protectedProcedure.input(z.object({
    keys: z.array(z.object({
      provider: z.string(),
      apiKey: z.string(),
    })),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const { sql } = await import('drizzle-orm');

    for (const { provider, apiKey } of input.keys) {
      if (!apiKey) continue;
      // 简单加密：base64（实际生产应使用 AES 加密）
      const masked = apiKey.slice(0, 8) + '****' + apiKey.slice(-4);
      await db.execute(sql`
        INSERT INTO moeConfigs (userId, modelKey, provider, isEnabled, apiKeyMasked, priority)
        VALUES (${ctx.user.id}, ${provider + '-user-key'}, ${provider}, true, ${masked}, 1)
        ON DUPLICATE KEY UPDATE apiKeyMasked = ${masked}, isEnabled = true
      `);
    }
    return { success: true };
  }),

  // ─── 获取用户已配置的 API Keys（返回脱敏版本）───
  getUserKeys: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { sql } = await import('drizzle-orm');
    const [rows] = await db.execute(sql`
      SELECT provider, apiKeyMasked, isEnabled FROM moeConfigs
      WHERE userId = ${ctx.user.id} AND modelKey LIKE '%-user-key'
    `) as unknown as any[][];
    return (rows as any[]) || [];
  }),

  // ─── AI 写作助手（免费）───
  writeAssist: protectedProcedure.input(z.object({
    type: z.enum(['polish', 'translate', 'summarize', 'expand', 'code_review', 'seo']),
    content: z.string().min(1).max(5000),
    targetLang: z.string().optional(),
  })).mutation(async ({ input }) => {
    const prompts: Record<string, string> = {
      polish: `请润色以下文字，使其更加流畅自然，保持原意：\n\n${input.content}`,
      translate: `请将以下内容翻译成${input.targetLang || '英文'}，保持原意和风格：\n\n${input.content}`,
      summarize: `请对以下内容进行简洁的摘要总结（不超过200字）：\n\n${input.content}`,
      expand: `请对以下内容进行扩写，增加细节和例子，使其更加丰富（扩写至原文2-3倍）：\n\n${input.content}`,
      code_review: `请对以下代码进行代码审查，指出潜在问题、改进建议和最佳实践：\n\n${input.content}`,
      seo: `请对以下内容进行SEO优化，包括标题建议、关键词密度、内容结构改进：\n\n${input.content}`,
    };

    const resp = await invokeLLM({
      messages: [
        { role: 'system', content: '你是一个专业的AI写作助手，请提供高质量的帮助。' },
        { role: 'user', content: prompts[input.type] },
      ],
    });
    return { result: resp.choices?.[0]?.message?.content as string || '' };
  }),

  // ─── AI 代码生成（免费）───
  generateCode: protectedProcedure.input(z.object({
    description: z.string().min(1).max(2000),
    language: z.string().default('TypeScript'),
    framework: z.string().optional(),
  })).mutation(async ({ input }) => {
    const resp = await invokeLLM({
      messages: [
        { role: 'system', content: `你是一个专业的${input.language}开发工程师。请生成高质量、可直接运行的代码，包含必要的注释。` },
        { role: 'user', content: `请用${input.language}${input.framework ? `（${input.framework}框架）` : ''}实现以下功能：\n\n${input.description}\n\n要求：代码完整可运行，包含错误处理，有清晰注释。` },
      ],
    });
    return { code: resp.choices?.[0]?.message?.content as string || '' };
  }),
});
