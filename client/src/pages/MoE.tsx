import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { Network, Zap, Loader2, ToggleLeft, ToggleRight, DollarSign, Cpu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TASK_TYPES = [
  { key: 'code',       label: '代码生成',  color: 'var(--success)' },
  { key: 'reasoning',  label: '逻辑推理',  color: 'var(--brand-primary)' },
  { key: 'general',    label: '通用对话',  color: 'var(--info)' },
  { key: 'chinese',    label: '中文处理',  color: 'var(--warning)' },
  { key: 'multimodal', label: '多模态',    color: '#F472B6' },
  { key: 'creative',   label: '创意写作',  color: '#34D399' },
  { key: 'analysis',   label: '数据分析',  color: '#FB923C' },
  { key: 'local',      label: '本地模型',  color: 'var(--text-muted)' },
];

const PROVIDER_COLORS: Record<string, string> = {
  DeepSeek: '#38BDF8',
  Alibaba:  '#F59E0B',
  OpenAI:   '#34D399',
  Anthropic: '#F472B6',
  'Meta/Local': '#94A3B8',
};

export default function MoEPage() {
  const { t } = useI18n();
  const [testTask, setTestTask] = useState('code');
  const [testResult, setTestResult] = useState<{ selectedModel: string; modelKey: string } | null>(null);

  const { data: models, isLoading, refetch } = trpc.moe.models.useQuery();
  const toggleModel = trpc.moe.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success('模型状态已更新'); },
  });
  const routeTest = trpc.moe.route.useMutation({
    onSuccess: (data) => { setTestResult(data); },
  });

  const enabledCount = (models || []).filter(m => m.enabled).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#34D399]/20 border border-[#34D399]/30 flex items-center justify-center">
          <Network size={20} className="text-[#34D399]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t('moe_title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('moe_subtitle')}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-extrabold text-[var(--brand-light)] mb-1">{(models || []).length}</div>
          <div className="text-xs text-[var(--text-secondary)]">已配置模型</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-extrabold text-[var(--success)] mb-1">{enabledCount}</div>
          <div className="text-xs text-[var(--text-secondary)]">已启用</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-extrabold text-[var(--warning)] mb-1">{TASK_TYPES.length}</div>
          <div className="text-xs text-[var(--text-secondary)]">任务类型</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">模型配置列表</h3>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
          ) : (
            (models || []).map((model, i) => {
              const providerColor = PROVIDER_COLORS[model.provider] || 'var(--text-muted)';
              return (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`feature-card ${!model.enabled ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Provider badge */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${providerColor}20`, border: `1px solid ${providerColor}40` }}>
                      <Cpu size={18} style={{ color: providerColor }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{model.modelName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ color: providerColor, background: `${providerColor}20` }}>
                          {model.provider}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">优先级: {model.priority}</span>
                      </div>
                      {/* Task type tags */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {((model.taskTypes as string[]) || []).map(tt => {
                          const taskInfo = TASK_TYPES.find(t => t.key === tt);
                          return (
                            <span key={tt} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: taskInfo?.color || 'var(--text-muted)', background: `${taskInfo?.color || '#94A3B8'}15` }}>
                              {taskInfo?.label || tt}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cost & Toggle */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-[var(--text-muted)]">成本</div>
                        <div className="text-xs font-bold text-[var(--success)]">
                          {model.costPerMToken === 0 ? '免费' : `$${model.costPerMToken}/M`}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleModel.mutate({ modelKey: model.modelKey, enabled: !model.enabled })}
                        style={{ color: model.enabled ? 'var(--brand-light)' : 'var(--text-muted)' }}
                      >
                        {model.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  </div>

                  {/* Context window */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>上下文窗口: <span className="text-[var(--text-secondary)]">{((model.maxContextWindow || 0) / 1000).toFixed(0)}K tokens</span></span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right: Route Test */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Zap size={14} className="text-[var(--warning)]" /> 路由测试
            </h3>
            <div className="mb-4">
              <div className="text-xs text-[var(--text-muted)] mb-2">选择任务类型:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {TASK_TYPES.map(tt => (
                  <button
                    key={tt.key}
                    onClick={() => setTestTask(tt.key)}
                    className={`text-xs py-1.5 px-2 rounded-lg transition-all font-medium ${
                      testTask === tt.key
                        ? 'text-white'
                        : 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:text-white'
                    }`}
                    style={testTask === tt.key ? { background: tt.color } : {}}
                  >
                    {tt.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={() => routeTest.mutate({ taskType: testTask, prompt: 'test' })}
              disabled={routeTest.isPending}
              className="btn-brand w-full gap-2 h-9"
            >
              {routeTest.isPending ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
              测试路由
            </Button>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30"
              >
                <div className="text-xs text-[var(--text-muted)] mb-1">路由结果:</div>
                <div className="text-sm font-bold text-[var(--brand-light)]">{testResult.selectedModel}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{testResult.modelKey}</div>
              </motion.div>
            )}
          </div>

          {/* Task Type Map */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">任务类型说明</h3>
            <div className="space-y-2">
              {TASK_TYPES.map(tt => (
                <div key={tt.key} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tt.color }} />
                  <span className="text-[var(--text-secondary)]">{tt.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
