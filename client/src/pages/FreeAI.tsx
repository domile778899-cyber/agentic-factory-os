/**
 * 免费 AI 对话中心 v2.0
 * 新增功能：
 * 1. SSE 流式输出（逐字显示，打字机效果）
 * 2. 对话历史持久化（数据库存储 + 侧边栏列表）
 * 3. 图片上传与多模态分析（Gemini 视觉理解）
 * 4. 对话重命名/置顶/删除
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  MessageSquare, Send, Loader2, Trash2, Copy, Download,
  ChevronDown, Gift, Key, CheckCircle2, Eye, EyeOff,
  Sparkles, Code2, FileText, Languages, Expand, Search,
  Bot, User, Zap, ExternalLink, Plus, Pin, PinOff,
  Image, X, Edit3, MoreHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: number;
  imageUrls?: string[];
  isStreaming?: boolean;
};

const WRITE_TOOLS = [
  { key: 'polish', label: '润色文字', icon: Sparkles, desc: '让文字更流畅自然' },
  { key: 'translate', label: '翻译', icon: Languages, desc: '多语言互译' },
  { key: 'summarize', label: '摘要总结', icon: FileText, desc: '提炼核心要点' },
  { key: 'expand', label: '扩写', icon: Expand, desc: '丰富内容细节' },
  { key: 'code_review', label: '代码审查', icon: Code2, desc: '发现潜在问题' },
  { key: 'seo', label: 'SEO优化', icon: Search, desc: '提升搜索排名' },
];

const MODEL_SUPPORTS_VISION = ['gemini-2.0-flash', 'gemini-1.5-flash'];

export default function FreeAIPage() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('user_api_keys');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'models'>('chat');
  const [toolInput, setToolInput] = useState('');
  const [toolResult, setToolResult] = useState('');
  const [activeTool, setActiveTool] = useState('polish');
  const [targetLang, setTargetLang] = useState('英文');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [pendingImages, setPendingImages] = useState<{ url: string; base64: string; name: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConvId, setEditingConvId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: models } = trpc.freeAi.models.useQuery();
  const { data: conversations, refetch: refetchConvs } = trpc.chatHistory.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: historyMessages } = trpc.chatHistory.messages.useQuery(
    { conversationId: currentConvId! },
    { enabled: !!currentConvId && isAuthenticated }
  );

  const createConv = trpc.chatHistory.create.useMutation({ onSuccess: (d) => { setCurrentConvId(d.id); refetchConvs(); } });
  const saveMessage = trpc.chatHistory.saveMessage.useMutation();
  const deleteConv = trpc.chatHistory.delete.useMutation({ onSuccess: () => { refetchConvs(); if (currentConvId) { setCurrentConvId(null); setMessages([]); } } });
  const renameConv = trpc.chatHistory.rename.useMutation({ onSuccess: () => { refetchConvs(); setEditingConvId(null); } });
  const togglePin = trpc.chatHistory.togglePin.useMutation({ onSuccess: () => refetchConvs() });
  const uploadImage = trpc.chatHistory.uploadImage.useMutation();
  const writeAssist = trpc.freeAi.writeAssist.useMutation({
    onSuccess: (data) => setToolResult(data.result),
    onError: (e) => toast.error(e.message),
  });
  const testKey = trpc.freeAi.testApiKey.useMutation({
    onSuccess: (data) => { if (data.success) toast.success(data.message); else toast.error(data.message); },
  });

  // 加载历史消息
  useEffect(() => {
    if (historyMessages && currentConvId) {
      setMessages(historyMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
        model: m.modelKey,
        timestamp: new Date(m.createdAt).getTime(),
        imageUrls: typeof m.imageUrls === 'string' ? JSON.parse(m.imageUrls) : m.imageUrls || [],
      })));
    }
  }, [historyMessages, currentConvId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText]);

  // 保存 API Keys 到 localStorage
  useEffect(() => {
    localStorage.setItem('user_api_keys', JSON.stringify(userApiKeys));
  }, [userApiKeys]);

  // ─── SSE 流式发送 ───
  const handleSend = useCallback(async () => {
    if ((!input.trim() && pendingImages.length === 0) || isStreaming) return;
    if (!isAuthenticated) { toast.error('请先登录后使用'); return; }

    const currentInput = input;
    const currentImages = [...pendingImages];
    setInput('');
    setPendingImages([]);

    // 上传图片到 S3
    let imageUrls: string[] = [];
    if (currentImages.length > 0) {
      setUploadingImage(true);
      try {
        for (const img of currentImages) {
          const result = await uploadImage.mutateAsync({
            base64: img.base64,
            mimeType: 'image/jpeg',
            filename: img.name,
          });
          imageUrls.push(result.url);
        }
      } catch { imageUrls = currentImages.map(i => i.url); } // 降级使用本地 URL
      setUploadingImage(false);
    }

    const userMsg: Message = {
      role: 'user',
      content: currentInput || (imageUrls.length > 0 ? '请分析这张图片' : ''),
      timestamp: Date.now(),
      imageUrls,
    };
    setMessages(prev => [...prev, userMsg]);

    // 创建或使用现有对话
    let convId = currentConvId;
    if (!convId && isAuthenticated) {
      const result = await createConv.mutateAsync({ title: currentInput.slice(0, 50) || '图片分析', modelKey: selectedModel });
      convId = result.id;
    }

    // 保存用户消息
    if (convId) {
      saveMessage.mutate({ conversationId: convId, role: 'user', content: userMsg.content, imageUrls, modelKey: selectedModel });
    }

    // 获取当前模型的 API Key
    const currentModelConfig = models?.find(m => m.key === selectedModel);
    const apiKey = currentModelConfig ? userApiKeys[currentModelConfig.provider] || '' : '';

    // 开始 SSE 流式请求
    setIsStreaming(true);
    setStreamingText('');
    abortRef.current = new AbortController();

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          modelKey: selectedModel,
          userApiKey: apiKey,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) throw new Error('流式请求失败');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let finalModel = selectedModel;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                setStreamingText(fullText);
              }
              if (data.done) {
                finalModel = data.model || selectedModel;
              }
              if (data.error) throw new Error(data.error);
            } catch {}
          }
        }
      }

      // 流式完成，添加到消息列表
      const assistantMsg: Message = {
        role: 'assistant',
        content: fullText,
        model: finalModel,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreamingText('');

      // 保存 AI 回复
      if (convId) {
        saveMessage.mutate({ conversationId: convId, role: 'assistant', content: fullText, modelKey: finalModel });
        refetchConvs();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error(`AI 回复失败: ${err.message}`);
      }
      setStreamingText('');
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, pendingImages, isStreaming, isAuthenticated, messages, selectedModel, currentConvId, models, userApiKeys]);

  // ─── 图片上传处理 ───
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error('图片不能超过 10MB'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        const url = URL.createObjectURL(file);
        setPendingImages(prev => [...prev, { url, base64, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast.success('已复制'); };
  const handleExport = () => {
    const text = messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'chat.txt'; a.click();
  };

  const currentModel = models?.find(m => m.key === selectedModel);
  const supportsVision = MODEL_SUPPORTS_VISION.includes(selectedModel);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ─── 对话历史侧边栏 ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-[var(--border-subtle)] bg-[#0D0D16] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <Button onClick={async () => {
                if (!isAuthenticated) { toast.error('请先登录'); return; }
                setCurrentConvId(null);
                setMessages([]);
                const result = await createConv.mutateAsync({ title: '新对话', modelKey: selectedModel });
                setCurrentConvId(result.id);
              }} className="btn-brand w-full gap-2 h-8 text-xs">
                <Plus size={12} /> 新建对话
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {(conversations || []).map((conv: any) => (
                <div key={conv.id}
                  className={`group flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer transition-all ${currentConvId === conv.id ? 'bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/20' : 'hover:bg-[var(--bg-elevated)]'}`}
                  onClick={() => { setCurrentConvId(conv.id); setMessages([]); }}>
                  {editingConvId === conv.id ? (
                    <input autoFocus value={editingTitle} onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => renameConv.mutate({ id: conv.id, title: editingTitle })}
                      onKeyDown={e => { if (e.key === 'Enter') renameConv.mutate({ id: conv.id, title: editingTitle }); if (e.key === 'Escape') setEditingConvId(null); }}
                      className="flex-1 bg-transparent text-[10px] text-white outline-none border-b border-[var(--brand-primary)]"
                      onClick={e => e.stopPropagation()} />
                  ) : (
                    <span className="flex-1 text-[10px] text-[var(--text-secondary)] truncate">
                      {conv.isPinned && <span className="text-[var(--warning)] mr-1">📌</span>}
                      {conv.title}
                    </span>
                  )}
                  <div className="hidden group-hover:flex gap-0.5">
                    <button onClick={e => { e.stopPropagation(); setEditingConvId(conv.id); setEditingTitle(conv.title); }}
                      className="p-0.5 text-[var(--text-muted)] hover:text-white"><Edit3 size={10} /></button>
                    <button onClick={e => { e.stopPropagation(); togglePin.mutate({ id: conv.id, isPinned: !conv.isPinned }); }}
                      className="p-0.5 text-[var(--text-muted)] hover:text-[var(--warning)]">
                      {conv.isPinned ? <PinOff size={10} /> : <Pin size={10} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (confirm('确认删除此对话？')) deleteConv.mutate({ id: conv.id }); }}
                      className="p-0.5 text-[var(--text-muted)] hover:text-[var(--error)]"><Trash2 size={10} /></button>
                  </div>
                </div>
              ))}
              {(!conversations || conversations.length === 0) && (
                <div className="text-[10px] text-[var(--text-muted)] text-center py-4">暂无对话历史</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 主内容区 ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all">
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--success)] flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <h1 className="text-sm font-bold text-white">免费 AI 中心</h1>
            <span className="text-[10px] text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full border border-[var(--success)]/20">
              <Gift size={9} className="inline mr-0.5" /> 平台内置免费额度
            </span>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { key: 'chat', label: '对话', icon: MessageSquare },
              { key: 'tools', label: 'AI工具箱', icon: Sparkles },
              { key: 'models', label: '模型中心', icon: Zap },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${activeTab === tab.key ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white'}`}>
                  <Icon size={11} /> {tab.label}
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowApiKeys(!showApiKeys)}
            className="h-7 text-[10px] gap-1 text-[var(--text-secondary)]">
            <Key size={11} /> API Keys
          </Button>
        </div>

        {/* API Keys Panel */}
        <AnimatePresence>
          {showApiKeys && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Key size={12} className="text-[var(--warning)]" />
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">配置 API Keys（可选）</span>
                  <span className="text-[9px] text-[var(--text-muted)]">— 填入后使用你自己的额度，不填也可免费使用平台内置额度</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { provider: 'deepseek', label: 'DeepSeek', url: 'https://platform.deepseek.com', placeholder: 'sk-...' },
                    { provider: 'groq', label: 'Groq', url: 'https://console.groq.com', placeholder: 'gsk_...' },
                    { provider: 'gemini', label: 'Gemini', url: 'https://aistudio.google.com', placeholder: 'AIza...' },
                    { provider: 'qwen', label: '通义千问', url: 'https://dashscope.aliyuncs.com', placeholder: 'sk-...' },
                    { provider: 'siliconflow', label: '硅基流动', url: 'https://siliconflow.cn', placeholder: 'sk-...' },
                    { provider: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai', placeholder: 'sk-or-...' },
                  ].map(p => (
                    <div key={p.provider} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-medium text-[var(--text-secondary)]">{p.label}</label>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-[var(--brand-light)] hover:underline flex items-center gap-0.5">
                          免费获取 <ExternalLink size={7} />
                        </a>
                      </div>
                      <div className="flex gap-1">
                        <div className="relative flex-1">
                          <Input type={showKeys[p.provider] ? 'text' : 'password'}
                            value={userApiKeys[p.provider] || ''}
                            onChange={e => setUserApiKeys(prev => ({ ...prev, [p.provider]: e.target.value }))}
                            placeholder={p.placeholder}
                            className="input-dark h-6 text-[9px] pr-6" />
                          <button onClick={() => setShowKeys(prev => ({ ...prev, [p.provider]: !prev[p.provider] }))}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                            {showKeys[p.provider] ? <EyeOff size={9} /> : <Eye size={9} />}
                          </button>
                        </div>
                        <button onClick={() => {
                          const m = models?.find(m => m.provider === p.provider);
                          if (m && userApiKeys[p.provider]) testKey.mutate({ provider: p.provider, apiKey: userApiKeys[p.provider], modelKey: m.key });
                        }} className="px-1 py-0.5 rounded bg-[var(--brand-primary)]/15 text-[var(--brand-light)] text-[8px] hover:bg-[var(--brand-primary)]/25 flex-shrink-0">
                          测试
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* ═══ 对话界面 ═══ */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Model Selector */}
              <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setShowModelPicker(!showModelPicker)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px] font-medium text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 transition-all">
                    <span>{currentModel?.name || '选择模型'}</span>
                    {currentModel && <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: `${currentModel.color}20`, color: currentModel.color }}>{currentModel.badge}</span>}
                    {supportsVision && <span className="badge-brand text-[8px]">👁️ 视觉</span>}
                    <ChevronDown size={10} className={`transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showModelPicker && (
                      <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="absolute top-full left-0 mt-1 w-64 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden">
                          {(models || []).map(m => (
                            <button key={m.key} onClick={() => { setSelectedModel(m.key); setShowModelPicker(false); }}
                              className={`flex items-start gap-2 w-full px-3 py-2 text-left hover:bg-[var(--bg-base)] transition-all ${selectedModel === m.key ? 'bg-[var(--brand-primary)]/10' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-semibold text-[var(--text-primary)] truncate">{m.name}</span>
                                  <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: `${m.color}20`, color: m.color }}>{m.badge}</span>
                                  {MODEL_SUPPORTS_VISION.includes(m.key) && <span className="text-[8px] text-[var(--info)]">👁️</span>}
                                </div>
                                <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{m.freeLimit}</div>
                              </div>
                              {selectedModel === m.key && <CheckCircle2 size={12} className="text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                {supportsVision && (
                  <span className="text-[9px] text-[var(--info)] flex items-center gap-0.5">
                    <Image size={10} /> 支持图片分析
                  </span>
                )}
                <div className="ml-auto flex gap-1">
                  {messages.length > 0 && (
                    <>
                      <button onClick={handleExport} className="p-1.5 rounded text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all" title="导出对话">
                        <Download size={12} />
                      </button>
                      <button onClick={() => { setMessages([]); setCurrentConvId(null); }} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all" title="清空">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isStreaming && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--success)] flex items-center justify-center mb-3 shadow-lg">
                      <Bot size={28} className="text-white" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">免费 AI 对话</h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-4">
                      {supportsVision ? '支持图片上传分析！点击📎上传图片，或直接输入文字开始对话' : '选择任意免费模型开始对话，无需付费'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                      {['帮我写一个 Python 爬虫', '解释量子计算的原理', '帮我优化这段代码', '写一篇关于AI的文章'].map(q => (
                        <button key={q} onClick={() => setInput(q)}
                          className="text-left text-[10px] px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--brand-primary)]/10 border border-[var(--border-default)] hover:border-[var(--brand-primary)]/30 transition-all">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--brand-primary)]' : 'bg-gradient-to-br from-[var(--success)] to-[var(--brand-primary)]'}`}>
                      {msg.role === 'user' ? <User size={13} className="text-white" /> : <Bot size={13} className="text-white" />}
                    </div>
                    <div className={`flex-1 max-w-[82%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {/* 图片预览 */}
                      {msg.imageUrls && msg.imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1">
                          {msg.imageUrls.map((url, j) => (
                            <img key={j} src={url} alt="上传图片" className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-[var(--border-default)]" />
                          ))}
                        </div>
                      )}
                      <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${msg.role === 'user' ? 'bg-[var(--brand-primary)] text-white rounded-tr-sm' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-subtle)]'}`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : msg.content}
                      </div>
                      <div className={`flex items-center gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[9px] text-[var(--text-muted)]">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                          {msg.model && msg.role === 'assistant' && ` · ${msg.model}`}
                        </span>
                        <button onClick={() => handleCopy(msg.content)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                          <Copy size={10} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* 流式输出中 */}
                {isStreaming && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--success)] to-[var(--brand-primary)] flex items-center justify-center">
                      <Bot size={13} className="text-white" />
                    </div>
                    <div className="flex-1 max-w-[82%]">
                      <div className="bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-3.5 py-2.5 border border-[var(--border-subtle)]">
                        {streamingText ? (
                          <div className="prose prose-invert prose-sm max-w-none text-sm">
                            <Streamdown>{streamingText}</Streamdown>
                            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
                              className="inline-block w-0.5 h-4 bg-[var(--brand-primary)] ml-0.5 align-middle" />
                          </div>
                        ) : (
                          <div className="flex gap-1 items-center py-1">
                            {[0, 1, 2].map(i => (
                              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 待上传图片预览 */}
              {pendingImages.length > 0 && (
                <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex gap-2 flex-wrap">
                  {pendingImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img.url} alt={img.name} className="w-16 h-16 rounded-lg object-cover border border-[var(--border-default)]" />
                      <button onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--error)] text-white flex items-center justify-center">
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-[var(--border-subtle)]">
                <div className="flex gap-2 items-end">
                  {supportsVision && (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                      <button onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-lg border transition-all flex-shrink-0 ${pendingImages.length > 0 ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-light)]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-white hover:border-[var(--brand-primary)]/50'}`}
                        title="上传图片（仅 Gemini 支持）">
                        <Image size={16} />
                      </button>
                    </>
                  )}
                  <Textarea value={input} onChange={e => setInput(e.target.value)}
                    placeholder={supportsVision ? `向 ${currentModel?.name} 发消息，或上传图片分析... (Ctrl+Enter)` : `向 ${currentModel?.name || 'AI'} 发送消息... (Ctrl+Enter 发送)`}
                    className="flex-1 min-h-[52px] max-h-[100px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] resize-none text-sm"
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }} />
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button onClick={handleSend} disabled={isStreaming || uploadingImage || (!input.trim() && pendingImages.length === 0) || !isAuthenticated}
                      className="btn-brand h-9 w-9 p-0">
                      {isStreaming || uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </Button>
                    {isStreaming && (
                      <button onClick={() => abortRef.current?.abort()}
                        className="h-9 w-9 rounded-lg bg-[var(--error)]/15 text-[var(--error)] hover:bg-[var(--error)]/25 flex items-center justify-center transition-all" title="停止">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {!isAuthenticated && <p className="text-[9px] text-[var(--warning)] mt-1 text-center">请先登录后使用</p>}
              </div>
            </div>
          )}

          {/* ═══ AI 工具箱 ═══ */}
          {activeTab === 'tools' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {WRITE_TOOLS.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button key={tool.key} onClick={() => setActiveTool(tool.key)}
                      className={`feature-card text-left transition-all ${activeTool === tool.key ? 'border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/5' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className="text-[var(--brand-light)]" />
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{tool.label}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">{tool.desc}</p>
                    </button>
                  );
                })}
              </div>
              <div className="glass-card p-4 space-y-3">
                {activeTool === 'translate' && (
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">目标语言</label>
                    <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="input-dark w-40 text-xs">
                      {['英文', '中文', '日文', '韩文', '法文', '德文', '西班牙文', '阿拉伯文'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                )}
                <Textarea value={toolInput} onChange={e => setToolInput(e.target.value)}
                  placeholder="在此输入需要处理的文字或代码..."
                  className="bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] resize-none min-h-[80px] text-sm" rows={4} />
                <Button onClick={() => { if (!toolInput.trim()) return toast.error('请输入内容'); if (!isAuthenticated) return toast.error('请先登录'); writeAssist.mutate({ type: activeTool as any, content: toolInput, targetLang }); }}
                  disabled={writeAssist.isPending || !toolInput.trim() || !isAuthenticated}
                  className="btn-brand gap-2 w-full h-9">
                  {writeAssist.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {writeAssist.isPending ? '处理中...' : '开始处理'}
                </Button>
                {toolResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-[var(--text-muted)]">处理结果</label>
                      <button onClick={() => handleCopy(toolResult)} className="text-[9px] text-[var(--brand-light)] flex items-center gap-0.5 hover:underline">
                        <Copy size={9} /> 复制
                      </button>
                    </div>
                    <div className="bg-[var(--bg-elevated)] rounded-xl p-3 text-sm text-[var(--text-primary)] border border-[var(--border-subtle)]">
                      <Streamdown>{toolResult}</Streamdown>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ═══ 模型中心 ═══ */}
          {activeTab === 'models' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="glass-card p-3 border-[var(--success)]/20 bg-[var(--success)]/5">
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={13} className="text-[var(--success)]" />
                  <span className="text-xs font-bold text-white">平台内置免费额度</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  登录即可使用，无需注册任何第三方账号。如需更多用量，在 API Keys 中填入自己的免费密钥。
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {(models || []).map((model, i) => (
                  <motion.div key={model.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                    className={`feature-card cursor-pointer ${selectedModel === model.key ? 'border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/5' : ''}`}
                    onClick={() => { setSelectedModel(model.key); setActiveTab('chat'); }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{model.name}</span>
                          {model.isBuiltIn && <span className="badge-success text-[8px]">内置</span>}
                          {MODEL_SUPPORTS_VISION.includes(model.key) && <span className="text-[8px] text-[var(--info)]">👁️ 视觉</span>}
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${model.color}20`, color: model.color }}>{model.badge}</span>
                      </div>
                      {selectedModel === model.key && <CheckCircle2 size={14} className="text-[var(--brand-primary)]" />}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] mb-2">{model.freeLimit}</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {model.strengths.map(s => <span key={s} className="text-[8px] px-1 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{s}</span>)}
                    </div>
                    <div className="flex items-center justify-between">
                      <a href={model.signupUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="text-[9px] text-[var(--brand-light)] hover:underline flex items-center gap-0.5">
                        免费注册 <ExternalLink size={8} />
                      </a>
                      <Button size="sm" className="h-6 text-[9px] px-2 btn-brand" onClick={e => { e.stopPropagation(); setSelectedModel(model.key); setActiveTab('chat'); }}>
                        使用
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
