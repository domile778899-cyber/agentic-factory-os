import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { Bot, Shield, Scale, Server, CandlestickChart, Share2, DollarSign, Brain, Code, BarChart3, Eye, Accessibility, Search, Loader2, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AGENT_LAYER_LABELS } from '@shared/types';

const AGENT_ICONS: Record<string, React.ElementType> = {
  security_architect: Shield,
  legal_compliance:   Scale,
  backend_engineer:   Server,
  exchange_expert:    CandlestickChart,
  social_expert:      Share2,
  biz_architect:      DollarSign,
  memory_architect:   Brain,
  infra_security:     Shield,
  ai_mentor:          Code,
  decision_advisor:   Zap,
  data_analyst:       BarChart3,
  cyber_auditor:      Eye,
  accessibility:      Accessibility,
  researcher:         Search,
};

const AGENT_COLORS: Record<string, string> = {
  security_architect: 'var(--agent-security)',
  legal_compliance:   'var(--agent-legal)',
  backend_engineer:   'var(--agent-backend)',
  exchange_expert:    'var(--agent-finance)',
  social_expert:      'var(--agent-ux)',
  biz_architect:      'var(--agent-finance)',
  memory_architect:   'var(--agent-architect)',
  infra_security:     'var(--agent-infra)',
  ai_mentor:          'var(--agent-coder)',
  decision_advisor:   'var(--agent-pm)',
  data_analyst:       'var(--agent-data)',
  cyber_auditor:      'var(--agent-security)',
  accessibility:      'var(--agent-reviewer)',
  researcher:         'var(--agent-research)',
};

export default function AgentsPage() {
  const { t } = useI18n();
  const { data: agents, isLoading, refetch } = trpc.agents.list.useQuery();
  const toggleAgent = trpc.agents.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success('代理人状态已更新'); },
    onError: e => toast.error(e.message),
  });

  const grouped = (agents || []).reduce((acc, a) => {
    if (!acc[a.layer]) acc[a.layer] = [];
    acc[a.layer].push(a);
    return acc;
  }, {} as Record<string, NonNullable<typeof agents>>);

  const layerOrder = ['infrastructure', 'intelligence', 'audit'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--success)]/20 border border-[var(--success)]/30 flex items-center justify-center">
            <Bot size={20} className="text-[var(--success)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('agents_title')}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{t('agents_subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] inline-block" /> 在线
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--warning)] inline-block" /> 忙碌
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] inline-block" /> 离线
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : (
        <div className="space-y-8">
          {layerOrder.map(layer => {
            const layerAgents = grouped[layer] || [];
            if (!layerAgents.length) return null;
            const layerInfo = AGENT_LAYER_LABELS[layer];
            return (
              <motion.div
                key={layer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: layerOrder.indexOf(layer) * 0.1 }}
              >
                {/* Layer Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{ color: layerInfo.color, borderColor: `${layerInfo.color}40`, background: `${layerInfo.color}15` }}
                  >
                    {layerInfo.zh}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                </div>

                {/* Agent Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {layerAgents.map((agent, i) => {
                    const Icon = AGENT_ICONS[agent.agentKey] || Bot;
                    const color = AGENT_COLORS[agent.agentKey] || 'var(--brand-primary)';
                    const statusColor = agent.status === 'online' ? 'var(--success)' : agent.status === 'busy' ? 'var(--warning)' : 'var(--text-muted)';

                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`feature-card ${!agent.enabled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                            style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                          >
                            <Icon size={20} style={{ color }} />
                            {/* Status dot */}
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)]"
                              style={{ background: statusColor }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{agent.name}</h3>
                              {/* Toggle */}
                              <button
                                onClick={() => toggleAgent.mutate({ id: agent.id, enabled: !agent.enabled })}
                                className="flex-shrink-0 transition-colors"
                                style={{ color: agent.enabled ? 'var(--brand-light)' : 'var(--text-muted)' }}
                              >
                                {agent.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                              </button>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed line-clamp-2">{agent.role}</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: statusColor, background: `${statusColor}20` }}
                            >
                              {agent.status === 'online' ? t('agent_online') : agent.status === 'busy' ? t('agent_busy') : t('agent_offline')}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {t('agent_tasks')}: <span className="text-[var(--text-secondary)] font-medium">{agent.tasksCompleted}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
