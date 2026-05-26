import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Brain, Key, ToggleLeft, ToggleRight, Loader2, CheckCircle2, Gift, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PROVIDER_LOGOS: Record<string, string> = {
  deepseek: '🔵', qwen: '🟠', gemini: '🟢', groq: '⚡', siliconflow: '💎',
  openai: '🤖', anthropic: '🟣', ollama: '🦙',
};

const PROVIDER_DOCS: Record<string, string> = {
  deepseek: 'https://platform.deepseek.com/api_keys',
  qwen: 'https://dashscope.aliyuncs.com/',
  gemini: 'https://aistudio.google.com/app/apikey',
  groq: 'https://console.groq.com/keys',
  siliconflow: 'https://cloud.siliconflow.cn/account/ak',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  ollama: 'http://localhost:11434',
};

export default function ModelProvidersPage() {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const { data: providers, isLoading, refetch } = trpc.lobe.providers.list.useQuery();
  const setApiKey = trpc.lobe.providers.setApiKey.useMutation({
    onSuccess: () => { refetch(); setEditingProvider(null); setApiKeyInput(''); toast.success('API Key 已保存！'); },
    onError: e => toast.error(e.message),
  });
  const toggleProvider = trpc.lobe.providers.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  const freeProviders = (providers || []).filter((p: any) => p.isFree);
  const paidProviders = (providers || []).filter((p: any) => !p.isFree);

  const ProviderCard = ({ provider }: { provider: any }) => {
    const logo = PROVIDER_LOGOS[provider.providerKey] || '🤖';
    const isEditing = editingProvider === provider.providerKey;
    const models = typeof provider.models === 'string' ? JSON.parse(provider.models) : (provider.models || []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`feature-card ${!provider.enabled ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">{logo}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[var(--text-primary)]">{provider.providerName}</span>
              {provider.isFree && <span className="badge-success text-[10px] flex items-center gap-0.5"><Gift size={9} /> 免费</span>}
              {provider.apiKey && <span className="badge-brand text-[10px] flex items-center gap-0.5"><Key size={9} /> 已配置</span>}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {models.slice(0, 3).map((m: string) => (
                <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] font-mono">{m}</span>
              ))}
              {models.length > 3 && <span className="text-[9px] text-[var(--text-muted)]">+{models.length - 3}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => toggleProvider.mutate({ id: provider.id, enabled: !provider.enabled })}
              style={{ color: provider.enabled ? 'var(--brand-light)' : 'var(--text-muted)' }}>
              {provider.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button size="sm" variant="ghost" onClick={() => { setEditingProvider(provider.providerKey); setApiKeyInput(''); }}
            className="flex-1 h-7 text-xs gap-1 text-[var(--text-secondary)] hover:text-[var(--brand-light)]">
            <Key size={11} /> {provider.apiKey ? '更新 API Key' : '配置 API Key'}
          </Button>
          <a href={PROVIDER_DOCS[provider.providerKey]} target="_blank" rel="noopener noreferrer"
            className="text-xs px-2 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand-light)] transition-colors">
            获取 Key →
          </a>
        </div>

        {/* Inline API Key Input */}
        <AnimatePresence>
          {isEditing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder={`输入 ${provider.providerName} API Key...`}
                    className="input-dark pr-8 font-mono text-xs"
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <Button size="sm" onClick={() => setApiKey.mutate({ providerKey: provider.providerKey, apiKey: apiKeyInput })}
                  disabled={!apiKeyInput || setApiKey.isPending} className="btn-brand h-9 px-3">
                  {setApiKey.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                </Button>
                <button onClick={() => setEditingProvider(null)} className="text-[var(--text-muted)] hover:text-white px-1">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/30 flex items-center justify-center">
          <Brain size={20} className="text-[var(--brand-light)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">模型服务商</h1>
          <p className="text-sm text-[var(--text-secondary)]">配置 AI 模型 API，支持多家免费服务商</p>
        </div>
      </motion.div>

      {/* Free Providers Banner */}
      <div className="glass-card p-4 border-[var(--success)]/20 bg-[var(--success)]/5">
        <div className="flex items-center gap-3">
          <Gift size={20} className="text-[var(--success)] flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-white">🎉 {freeProviders.length} 个免费服务商可用</div>
            <div className="text-xs text-[var(--text-secondary)]">DeepSeek、Qwen、Gemini Flash、Groq、硅基流动均提供免费额度，无需付费即可开始使用！</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <>
          {/* Free Providers */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--success)] mb-3 flex items-center gap-2">
              <Gift size={14} /> 免费服务商
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freeProviders.map((p: any) => <ProviderCard key={p.id || p.providerKey} provider={p} />)}
            </div>
          </div>

          {/* Paid Providers */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <Key size={14} /> 付费服务商
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paidProviders.map((p: any) => <ProviderCard key={p.id || p.providerKey} provider={p} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
