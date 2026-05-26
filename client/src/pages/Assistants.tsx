import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { Bot, Plus, MessageSquare, Trash2, Loader2, Send, X, Sparkles, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

const PROVIDER_COLORS: Record<string, string> = {
  deepseek: '#38BDF8',
  qwen: '#F59E0B',
  gemini: '#34D399',
  groq: '#F472B6',
  siliconflow: '#818CF8',
  openai: '#34D399',
  anthropic: '#F472B6',
  ollama: '#94A3B8',
};

export default function AssistantsPage() {
  const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '', avatar: '🤖', systemPrompt: '', model: 'deepseek-chat', provider: 'deepseek' });

  const { data: assistants, isLoading, refetch } = trpc.lobe.assistants.list.useQuery();
  const createAssistant = trpc.lobe.assistants.create.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); toast.success('助理已创建！'); } });
  const deleteAssistant = trpc.lobe.assistants.delete.useMutation({ onSuccess: () => { refetch(); setSelectedAssistant(null); toast.success('助理已删除'); } });
  const chatMutation = trpc.lobe.assistants.chat.useMutation({
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content as string }]);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSend = () => {
    if (!inputMsg.trim() || !selectedAssistant) return;
    const userMsg = { role: 'user', content: inputMsg };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    chatMutation.mutate({
      assistantId: selectedAssistant.id,
      messages: [...chatMessages, userMsg].map(m => ({ role: m.role as any, content: m.content })),
      systemPrompt: selectedAssistant.systemPrompt,
      model: selectedAssistant.model,
    });
  };

  return (
    <div className="h-full flex gap-0">
      {/* Left: Assistant List */}
      <div className="w-72 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot size={16} className="text-[var(--brand-light)]" /> 助理
            </h1>
            <Button size="sm" onClick={() => setShowCreate(true)} className="btn-brand h-7 w-7 p-0">
              <Plus size={13} />
            </Button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">你的个人 AI 团队</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--brand-primary)]" /></div>
          ) : (
            (assistants || []).map((a: any, i: number) => (
              <motion.div
                key={a.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { setSelectedAssistant(a); setChatMessages([]); }}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all group ${selectedAssistant?.id === a.id ? 'bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/30' : 'hover:bg-[var(--bg-elevated)]'}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-[var(--bg-elevated)]">
                  {a.avatar || '🤖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{a.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{a.description}</div>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); deleteAssistant.mutate({ id: a.id }); }}
                    className="p-1 rounded text-[var(--error)] hover:bg-[var(--error)]/10">
                    <Trash2 size={11} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedAssistant ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="text-xl">{selectedAssistant.avatar}</div>
              <div>
                <div className="text-sm font-bold text-white">{selectedAssistant.name}</div>
                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
                  {selectedAssistant.model}
                  <span className="mx-1">·</span>
                  <span style={{ color: PROVIDER_COLORS[selectedAssistant.provider] || 'var(--text-muted)' }}>{selectedAssistant.provider}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">{selectedAssistant.avatar}</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">{selectedAssistant.name}</div>
                  <div className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">{selectedAssistant.description}</div>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {['你能帮我做什么？', '介绍一下你自己', '开始工作'].map(q => (
                      <button key={q} onClick={() => { setInputMsg(q); }} className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-light)] transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--brand-primary)]' : 'bg-[var(--bg-elevated)]'}`}>
                    {msg.role === 'user' ? '👤' : selectedAssistant.avatar}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-[var(--brand-primary)] text-white rounded-tr-sm' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm'}`}>
                    {msg.role === 'assistant' ? <Streamdown>{msg.content}</Streamdown> : msg.content}
                  </div>
                </motion.div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-sm">{selectedAssistant.avatar}</div>
                  <div className="bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
              <div className="flex gap-2">
                <Input
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`和 ${selectedAssistant.name} 对话...`}
                  className="flex-1 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <Button onClick={handleSend} disabled={!inputMsg.trim() || chatMutation.isPending} className="btn-brand h-9 w-9 p-0">
                  {chatMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)] mb-2">选择一个助理开始对话</p>
              <p className="text-xs text-[var(--text-muted)]">或创建你的专属 AI 团队成员</p>
              <Button onClick={() => setShowCreate(true)} className="btn-brand mt-4 gap-2">
                <Plus size={14} /> 创建助理
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="glass-card w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white">创建新助理</h2>
                  <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-white"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">头像</label>
                      <Input value={newForm.avatar} onChange={e => setNewForm(f => ({ ...f, avatar: e.target.value }))} className="input-dark w-16 text-center text-xl" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">助理名称 *</label>
                      <Input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：代码审查专家" className="input-dark" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">描述</label>
                    <Input value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} placeholder="这个助理擅长什么？" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">系统提示词</label>
                    <Textarea value={newForm.systemPrompt} onChange={e => setNewForm(f => ({ ...f, systemPrompt: e.target.value }))} placeholder="你是一位...，你擅长..." rows={3} className="input-dark resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">模型</label>
                      <select value={newForm.model} onChange={e => setNewForm(f => ({ ...f, model: e.target.value }))} className="input-dark">
                        <option value="deepseek-chat">DeepSeek Chat</option>
                        <option value="deepseek-reasoner">DeepSeek R1</option>
                        <option value="qwen-plus">Qwen Plus</option>
                        <option value="gemini-2.0-flash">Gemini Flash</option>
                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">服务商</label>
                      <select value={newForm.provider} onChange={e => setNewForm(f => ({ ...f, provider: e.target.value }))} className="input-dark">
                        <option value="deepseek">DeepSeek 🆓</option>
                        <option value="qwen">Qwen 🆓</option>
                        <option value="gemini">Gemini 🆓</option>
                        <option value="groq">Groq 🆓</option>
                        <option value="siliconflow">硅基流动 🆓</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-5">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-[var(--text-secondary)]">取消</Button>
                  <Button size="sm" onClick={() => createAssistant.mutate(newForm)} disabled={!newForm.name || createAssistant.isPending} className="btn-brand gap-1">
                    {createAssistant.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    创建
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
