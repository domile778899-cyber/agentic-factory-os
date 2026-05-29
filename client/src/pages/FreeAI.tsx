/**
 * 免费 AI 对话中心
 * - 9个免费模型可选（DeepSeek/Groq/Gemini/Qwen/SiliconFlow/OpenRouter）
 * - 平台内置额度：用户无需配置即可使用
 * - 用户可填入自己的 API Key 解锁更多用量
 * - 全功能对话界面（历史记录/清空/复制/导出）
 * - AI写作助手工具箱
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  MessageSquare, Send, Loader2, Trash2, Copy, Download,
  ChevronDown, Gift, Key, CheckCircle2, Eye, EyeOff,
  Sparkles, Code2, FileText, Languages, Expand, Search,
  Bot, User, Zap, ExternalLink, Plus, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

type Message = { role: 'user' | 'assistant'; content: string; model?: string; timestamp: number };

const WRITE_TOOLS = [
  { key: 'polish', label: '润色文字', icon: Sparkles, desc: '让文字更流畅自然' },
  { key: 'translate', label: '翻译', icon: Languages, desc: '多语言互译' },
  { key: 'summarize', label: '摘要总结', icon: FileText, desc: '提炼核心要点' },
  { key: 'expand', label: '扩写', icon: Expand, desc: '丰富内容细节' },
  { key: 'code_review', label: '代码审查', icon: Code2, desc: '发现潜在问题' },
  { key: 'seo', label: 'SEO优化', icon: Search, desc: '提升搜索排名' },
];

export default function FreeAIPage() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'models'>('chat');
  const [toolInput, setToolInput] = useState('');
  const [toolResult, setToolResult] = useState('');
  const [activeTool, setActiveTool] = useState('polish');
  const [targetLang, setTargetLang] = useState('英文');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: models } = trpc.freeAi.models.useQuery();
  const chatMutation = trpc.freeAi.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        model: data.model,
        timestamp: Date.now(),
      }]);
    },
    onError: (e) => toast.error(e.message),
  });
  const testKey = trpc.freeAi.testApiKey.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success(data.message);
      else toast.error(data.message);
    },
  });
  const writeAssist = trpc.freeAi.writeAssist.useMutation({
    onSuccess: (data) => setToolResult(data.result),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    if (!isAuthenticated) { toast.error('请先登录后使用'); return; }
    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    chatMutation.mutate({
      messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
      modelKey: selectedModel,
      userApiKey: userApiKeys[models?.find(m => m.key === selectedModel)?.provider || ''] || '',
    });
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast.success('已复制'); };
  const handleExport = () => {
    const text = messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'chat.txt'; a.click();
  };

  const currentModel = models?.find(m => m.key === selectedModel);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--success)] flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">免费 AI 中心</h1>
            <p className="text-xs text-[var(--text-muted)]">9个免费模型 · 无需付费 · 立即使用</p>
          </div>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white'}`}>
                <Icon size={12} /> {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowApiKeys(!showApiKeys)}
            className="h-8 text-xs gap-1 text-[var(--text-secondary)]">
            <Key size={12} /> API Keys
          </Button>
        </div>
      </div>

      {/* API Keys Panel */}
      <AnimatePresence>
        {showApiKeys && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Key size={13} className="text-[var(--warning)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">配置你的 API Keys（可选）</span>
                <span className="text-[10px] text-[var(--text-muted)]">— 填入后可解锁更多用量，不填也可免费使用平台内置额度</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { provider: 'deepseek', label: 'DeepSeek', url: 'https://platform.deepseek.com', placeholder: 'sk-...' },
                  { provider: 'groq', label: 'Groq', url: 'https://console.groq.com', placeholder: 'gsk_...' },
                  { provider: 'gemini', label: 'Google Gemini', url: 'https://aistudio.google.com', placeholder: 'AIza...' },
                  { provider: 'qwen', label: '通义千问', url: 'https://dashscope.aliyuncs.com', placeholder: 'sk-...' },
                  { provider: 'siliconflow', label: '硅基流动', url: 'https://siliconflow.cn', placeholder: 'sk-...' },
                  { provider: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai', placeholder: 'sk-or-...' },
                ].map(p => (
                  <div key={p.provider} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-medium text-[var(--text-secondary)]">{p.label}</label>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[var(--brand-light)] hover:underline flex items-center gap-0.5">
                        获取 <ExternalLink size={8} />
                      </a>
                    </div>
                    <div className="flex gap-1">
                      <div className="relative flex-1">
                        <Input type={showKeys[p.provider] ? 'text' : 'password'}
                          value={userApiKeys[p.provider] || ''}
                          onChange={e => setUserApiKeys(prev => ({ ...prev, [p.provider]: e.target.value }))}
                          placeholder={p.placeholder}
                          className="input-dark h-7 text-[10px] pr-7" />
                        <button onClick={() => setShowKeys(prev => ({ ...prev, [p.provider]: !prev[p.provider] }))}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                          {showKeys[p.provider] ? <EyeOff size={10} /> : <Eye size={10} />}
                        </button>
                      </div>
                      <button onClick={() => {
                        const modelForProvider = models?.find(m => m.provider === p.provider);
                        if (modelForProvider && userApiKeys[p.provider]) {
                          testKey.mutate({ provider: p.provider, apiKey: userApiKeys[p.provider], modelKey: modelForProvider.key });
                        }
                      }} className="px-1.5 py-1 rounded bg-[var(--brand-primary)]/15 text-[var(--brand-light)] text-[9px] hover:bg-[var(--brand-primary)]/25 transition-all flex-shrink-0">
                        测试
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                🔒 API Keys 仅保存在您的浏览器本地，不会上传到服务器
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
            {/* Model Selector Bar */}
            <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 transition-all">
                  <span className="text-sm">{currentModel ? '🤖' : '🤖'}</span>
                  <span>{currentModel?.name || '选择模型'}</span>
                  {currentModel && <span className="badge-success text-[9px]">{currentModel.badge}</span>}
                  <ChevronDown size={11} className={`transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showModelPicker && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                      <motion.div initial={{ opacity: 0, y: -5, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.96 }}
                        className="absolute top-full left-0 mt-1 w-72 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden">
                        {(models || []).map(m => (
                          <button key={m.key} onClick={() => { setSelectedModel(m.key); setShowModelPicker(false); }}
                            className={`flex items-start gap-3 w-full px-3 py-2.5 text-left hover:bg-[var(--bg-base)] transition-all ${selectedModel === m.key ? 'bg-[var(--brand-primary)]/10' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{m.name}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${m.color}20`, color: m.color }}>{m.badge}</span>
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.freeLimit}</div>
                            </div>
                            {selectedModel === m.key && <CheckCircle2 size={14} className="text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--success)]">
                <Gift size={11} />
                <span>平台内置免费额度 · 无需配置即可使用</span>
              </div>
              <div className="ml-auto flex gap-1.5">
                {messages.length > 0 && (
                  <>
                    <button onClick={handleExport} className="p-1.5 rounded text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all" title="导出对话">
                      <Download size={13} />
                    </button>
                    <button onClick={() => setMessages([])} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all" title="清空对话">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--success)] flex items-center justify-center mb-4 shadow-lg">
                    <Bot size={32} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">免费 AI 对话中心</h3>
                  <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
                    选择任意免费模型开始对话，无需付费，无需注册 API Key
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-sm">
                    {['帮我写一个 Python 爬虫', '解释量子计算的原理', '帮我优化这段代码', '写一篇关于AI的文章'].map(q => (
                      <button key={q} onClick={() => setInput(q)}
                        className="text-left text-xs px-3 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--brand-primary)]/10 border border-[var(--border-default)] hover:border-[var(--brand-primary)]/30 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--brand-primary)]' : 'bg-gradient-to-br from-[var(--success)] to-[var(--brand-primary)]'}`}>
                    {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-[var(--brand-primary)] text-white rounded-tr-sm' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-subtle)]'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : msg.content}
                    </div>
                    <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                        {msg.model && msg.role === 'assistant' && ` · ${msg.model}`}
                      </span>
                      <button onClick={() => handleCopy(msg.content)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {chatMutation.isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--success)] to-[var(--brand-primary)] flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-4 py-3 border border-[var(--border-subtle)]">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-[var(--brand-primary)]"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
              <div className="flex gap-3 items-end">
                <Textarea value={input} onChange={e => setInput(e.target.value)}
                  placeholder={`向 ${currentModel?.name || 'AI'} 发送消息... (Ctrl+Enter 发送)`}
                  className="flex-1 min-h-[60px] max-h-[120px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] resize-none text-sm"
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }} />
                <Button onClick={handleSend} disabled={chatMutation.isPending || !input.trim() || !isAuthenticated}
                  className="btn-brand h-10 w-10 p-0 flex-shrink-0">
                  {chatMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
              {!isAuthenticated && (
                <p className="text-[10px] text-[var(--warning)] mt-1 text-center">请先登录后使用免费 AI 功能</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ AI 工具箱 ═══ */}
        {activeTab === 'tools' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {WRITE_TOOLS.map(tool => {
                const Icon = tool.icon;
                return (
                  <button key={tool.key} onClick={() => setActiveTool(tool.key)}
                    className={`feature-card text-left transition-all ${activeTool === tool.key ? 'border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/5' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className="text-[var(--brand-light)]" />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{tool.label}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{tool.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                {(() => { const t = WRITE_TOOLS.find(t => t.key === activeTool); return t ? <t.icon size={16} className="text-[var(--brand-light)]" /> : null; })()}
                <span className="text-sm font-bold text-white">{WRITE_TOOLS.find(t => t.key === activeTool)?.label}</span>
              </div>

              {activeTool === 'translate' && (
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">目标语言</label>
                  <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="input-dark w-48">
                    {['英文', '中文', '日文', '韩文', '法文', '德文', '西班牙文', '阿拉伯文'].map(l => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">输入内容</label>
                <Textarea value={toolInput} onChange={e => setToolInput(e.target.value)}
                  placeholder="在此输入需要处理的文字或代码..."
                  className="bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] resize-none min-h-[100px]" rows={5} />
              </div>

              <Button onClick={() => {
                if (!toolInput.trim()) return toast.error('请输入内容');
                if (!isAuthenticated) return toast.error('请先登录');
                writeAssist.mutate({ type: activeTool as any, content: toolInput, targetLang });
              }} disabled={writeAssist.isPending || !toolInput.trim() || !isAuthenticated}
                className="btn-brand gap-2 w-full h-10">
                {writeAssist.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {writeAssist.isPending ? '处理中...' : '开始处理'}
              </Button>

              {toolResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[var(--text-muted)]">处理结果</label>
                    <button onClick={() => handleCopy(toolResult)} className="text-[10px] text-[var(--brand-light)] flex items-center gap-1 hover:underline">
                      <Copy size={10} /> 复制
                    </button>
                  </div>
                  <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-sm text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    <Streamdown>{toolResult}</Streamdown>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ═══ 模型中心 ═══ */}
        {activeTab === 'models' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="glass-card p-4 border-[var(--success)]/20 bg-[var(--success)]/5">
              <div className="flex items-center gap-2 mb-1">
                <Gift size={14} className="text-[var(--success)]" />
                <span className="text-sm font-bold text-white">平台免费额度说明</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Agentic Factory OS 为所有用户提供平台内置免费 AI 额度，无需注册任何第三方账号即可使用。
                如需更多用量，可在上方"API Keys"中填入自己的免费 API Key（各平台注册均可免费获取）。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(models || []).map((model, i) => (
                <motion.div key={model.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className={`feature-card cursor-pointer ${selectedModel === model.key ? 'border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/5' : ''}`}
                  onClick={() => { setSelectedModel(model.key); setActiveTab('chat'); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{model.name}</span>
                        {model.isBuiltIn && <span className="badge-success text-[9px]">内置</span>}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${model.color}20`, color: model.color }}>
                        {model.badge}
                      </span>
                    </div>
                    {selectedModel === model.key && <CheckCircle2 size={16} className="text-[var(--brand-primary)]" />}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="text-[10px] text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-secondary)]">免费额度：</span>{model.freeLimit}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-secondary)]">上下文：</span>{(model.contextWindow / 1000).toFixed(0)}K tokens
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {model.strengths.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{s}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <a href={model.signupUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="text-[10px] text-[var(--brand-light)] hover:underline flex items-center gap-0.5">
                      免费注册 <ExternalLink size={9} />
                    </a>
                    <Button size="sm" className="h-6 text-[10px] px-2 btn-brand" onClick={(e) => { e.stopPropagation(); setSelectedModel(model.key); setActiveTab('chat'); }}>
                      立即使用
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
