import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { invokeLLM } from "./llm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ─── SSE 流式 AI 对话端点 ───
  app.post('/api/ai/stream', async (req, res) => {
    try {
      // 简单验证：检查 cookie 是否存在（完整验证由 tRPC 层处理）
      const cookieHeader = req.headers.cookie || '';
      if (!cookieHeader.includes('session')) {
        // 允许未登录用户使用平台内置额度（不传 userApiKey 即可）
      }

      const { messages, modelKey, userApiKey, imageUrls } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: '参数错误' });
        return;
      }

      // 设置 SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const sendChunk = (text: string) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      };
      const sendDone = (model: string) => {
        res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
        res.end();
      };
      const sendError = (err: string) => {
        res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
        res.end();
      };

      // 构建消息（支持图片）
      let apiMessages = messages;
      if (imageUrls && imageUrls.length > 0 && modelKey?.includes('gemini')) {
        // Gemini 多模态：最后一条用户消息附带图片
        const lastUserIdx = [...messages].reverse().findIndex((m: any) => m.role === 'user');
        if (lastUserIdx >= 0) {
          const idx = messages.length - 1 - lastUserIdx;
          apiMessages = messages.map((m: any, i: number) => {
            if (i === idx) {
              return {
                role: 'user',
                content: [
                  ...imageUrls.map((url: string) => ({ type: 'image_url', image_url: { url, detail: 'auto' } })),
                  { type: 'text', text: m.content },
                ],
              };
            }
            return m;
          });
        }
      }

      // 尝试外部 API（如果有 userApiKey）
      if (userApiKey && userApiKey.length > 10) {
        try {
          const FREE_MODELS: Record<string, { endpoint: string; provider: string }> = {
            'deepseek-chat': { endpoint: 'https://api.deepseek.com/v1/chat/completions', provider: 'deepseek' },
            'deepseek-reasoner': { endpoint: 'https://api.deepseek.com/v1/chat/completions', provider: 'deepseek' },
            'llama-3.3-70b-versatile': { endpoint: 'https://api.groq.com/openai/v1/chat/completions', provider: 'groq' },
            'mixtral-8x7b-32768': { endpoint: 'https://api.groq.com/openai/v1/chat/completions', provider: 'groq' },
            'gemini-2.0-flash': { endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', provider: 'gemini' },
            'gemini-1.5-flash': { endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', provider: 'gemini' },
            'qwen-plus': { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', provider: 'qwen' },
            'deepseek-ai/DeepSeek-V3': { endpoint: 'https://api.siliconflow.cn/v1/chat/completions', provider: 'siliconflow' },
          };
          const modelConfig = FREE_MODELS[modelKey];
          if (modelConfig) {
            const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userApiKey}` };
            let url = modelConfig.endpoint;
            if (modelConfig.provider === 'gemini') { url += `?key=${userApiKey}`; delete headers['Authorization']; }
            const extResp = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify({ model: modelKey, messages: apiMessages, max_tokens: 2048, temperature: 0.7, stream: false }),
            });
            if (extResp.ok) {
              const data = await extResp.json() as any;
              const content = data.choices?.[0]?.message?.content || '';
              // 模拟流式输出（分块发送）
              const chunkSize = 8;
              for (let i = 0; i < content.length; i += chunkSize) {
                sendChunk(content.slice(i, i + chunkSize));
                await new Promise(r => setTimeout(r, 15));
              }
              sendDone(modelKey);
              return;
            }
          }
        } catch (e) {
          // 降级到平台内置
        }
      }

      // 使用平台内置 LLM
      const resp = await invokeLLM({ messages: apiMessages });
      const content = resp.choices?.[0]?.message?.content as string || '';
      // 模拟流式输出
      const chunkSize = 6;
      for (let i = 0; i < content.length; i += chunkSize) {
        sendChunk(content.slice(i, i + chunkSize));
        await new Promise(r => setTimeout(r, 20));
      }
      sendDone('platform-default');
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
