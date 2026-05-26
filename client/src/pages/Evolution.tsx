import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { Sparkles, MessageSquare, Cpu, BarChart3, GitBranch, Rocket, CheckCircle2, Loader2, Play, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EVOLUTION_STEPS = [
  { key: 'collecting',  icon: MessageSquare, label: '反馈收集',   desc: '收集用户交互反馈，筛选高质量样本' },
  { key: 'training',    icon: Cpu,           label: 'LoRA 微调',  desc: '基于优质样本进行参数高效微调' },
  { key: 'evaluating',  icon: BarChart3,     label: '效果评估',   desc: '在基准测试集上评估新版本性能' },
  { key: 'ab_testing',  icon: GitBranch,     label: 'A/B 测试',   desc: '将10%流量导向新版本进行对比' },
  { key: 'deploying',   icon: Rocket,        label: '自动部署',   desc: '评分超越基线则自动上线新版本' },
];

const LORA_VERSIONS = [
  { version: 'v1.2.0', score: 8.7, baseline: 8.2, status: 'active',   date: '2026-05-20', samples: 1240 },
  { version: 'v1.1.0', score: 8.2, baseline: 7.8, status: 'archived', date: '2026-05-10', samples: 980 },
  { version: 'v1.0.0', score: 7.8, baseline: 7.5, status: 'archived', date: '2026-04-28', samples: 720 },
];

export default function EvolutionPage() {
  const { t } = useI18n();
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const { data: cycle, refetch } = trpc.evolution.current.useQuery();
  const startCycle = trpc.evolution.start.useMutation({ onSuccess: () => { refetch(); toast.success('进化周期已启动！'); } });
  const addFeedback = trpc.evolution.addFeedback.useMutation({
    onSuccess: () => { refetch(); toast.success('反馈已记录，感谢您的贡献！'); setFeedbackScore(null); },
  });

  const currentStep = cycle?.status || 'idle';
  const feedbackProgress = cycle ? Math.min(100, ((cycle.feedbackCount || 0) / (cycle.triggerThreshold || 1000)) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--info)]/20 border border-[var(--info)]/30 flex items-center justify-center">
            <Sparkles size={20} className="text-[var(--info)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('evolution_title')}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{t('evolution_subtitle')}</p>
          </div>
        </div>
        <Button
          onClick={() => startCycle.mutate()}
          disabled={startCycle.isPending || (currentStep !== 'idle' && currentStep !== 'completed' && currentStep !== 'failed')}
          className="btn-brand gap-2 h-9"
        >
          {startCycle.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {t('evolution_start')}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Progress */}
        <div className="lg:col-span-2 space-y-5">
          {/* Current Status */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">进化流水线状态</h3>
            <div className="space-y-3">
              {EVOLUTION_STEPS.map((step, i) => {
                const Icon = step.icon;
                const stepOrder = EVOLUTION_STEPS.map(s => s.key);
                const currentIdx = stepOrder.indexOf(currentStep);
                const stepIdx = i;
                const isDone = currentIdx > stepIdx;
                const isActive = currentStep === step.key;
                const isPending = currentIdx < stepIdx;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      isActive ? 'border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/10' :
                      isDone  ? 'border-[var(--success)]/30 bg-[var(--success)]/5' :
                      'border-[var(--border-subtle)] opacity-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-[var(--brand-primary)]/20' :
                      isDone  ? 'bg-[var(--success)]/20' :
                      'bg-[var(--bg-elevated)]'
                    }`}>
                      {isDone ? <CheckCircle2 size={18} className="text-[var(--success)]" /> :
                       isActive ? <Loader2 size={18} className="text-[var(--brand-light)] animate-spin" /> :
                       <Icon size={18} className="text-[var(--text-muted)]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isActive ? 'text-[var(--brand-light)]' : isDone ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                          {step.label}
                        </span>
                        {isActive && <span className="badge-brand text-[10px]">进行中</span>}
                        {isDone && <span className="badge-success text-[10px]">完成</span>}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Feedback Collection Progress */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">反馈收集进度</h3>
              <span className="text-xs text-[var(--text-secondary)]">
                {cycle?.feedbackCount || 0} / {cycle?.triggerThreshold || 1000} 条
              </span>
            </div>
            <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-3">
              <motion.div
                className="progress-brand h-full"
                initial={{ width: 0 }}
                animate={{ width: `${feedbackProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>高质量样本: <span className="text-[var(--success)] font-medium">{cycle?.qualitySamples || 0}</span></span>
              <span>触发阈值: <span className="text-[var(--brand-light)] font-medium">{cycle?.triggerThreshold || 1000}</span></span>
            </div>

            {/* Feedback buttons */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)] mb-3">对当前 AI 回答质量评分（帮助进化引擎学习）:</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(score => (
                  <button
                    key={score}
                    onClick={() => setFeedbackScore(score)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      feedbackScore === score
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--brand-primary)]/20 hover:text-[var(--brand-light)]'
                    }`}
                  >
                    {score}
                  </button>
                ))}
                <Button
                  size="sm"
                  disabled={!feedbackScore || !cycle || addFeedback.isPending}
                  onClick={() => cycle && feedbackScore && addFeedback.mutate({ cycleId: cycle.id, qualityScore: feedbackScore })}
                  className="btn-brand px-3 h-9"
                >
                  {addFeedback.isPending ? <Loader2 size={13} className="animate-spin" /> : <ThumbsUp size={13} />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: LoRA Versions */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">LoRA 版本管理</h3>
            <div className="space-y-3">
              {LORA_VERSIONS.map((v, i) => (
                <motion.div
                  key={v.version}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-xl border ${v.status === 'active' ? 'border-[var(--success)]/40 bg-[var(--success)]/5' : 'border-[var(--border-subtle)]'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{v.version}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.status === 'active' ? 'badge-success' : 'text-[var(--text-muted)] bg-[var(--bg-elevated)]'}`}>
                      {v.status === 'active' ? '当前版本' : '已归档'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[var(--text-muted)]">评估分数</div>
                      <div className="text-[var(--success)] font-bold">{v.score}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">基线分数</div>
                      <div className="text-[var(--text-secondary)] font-bold">{v.baseline}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">训练样本</div>
                      <div className="text-[var(--brand-light)] font-bold">{v.samples}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">部署日期</div>
                      <div className="text-[var(--text-secondary)]">{v.date}</div>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div className="progress-brand h-full" style={{ width: `${(v.score / 10) * 100}%` }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* A/B Test Results */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">A/B 测试结果</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">新版本流量</span>
                <span className="text-[var(--brand-light)] font-bold">{cycle?.abTestTraffic || 10}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">新版本评分</span>
                <span className="text-[var(--success)] font-bold">{cycle?.evalScore?.toFixed(1) || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">基线评分</span>
                <span className="text-[var(--text-secondary)] font-bold">{cycle?.baselineScore?.toFixed(1) || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">自动回滚</span>
                <span className={`font-bold ${cycle?.autoRollback ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                  {cycle?.autoRollback ? '已启用' : '已禁用'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
