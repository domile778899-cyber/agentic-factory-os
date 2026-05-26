import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { CreditCard, Check, Zap, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SUBSCRIPTION_TIERS } from '@shared/types';

const TIER_FEATURES: Record<string, string[]> = {
  free:       ['2次/月 基础构建', '单智能体模式', 'Llama-3.3-70B 基础模型', '社区支持'],
  pro:        ['20次/月 完整构建', '14个代理人单兵调用', '优先模型队列', '双层记忆系统', '邮件支持'],
  team:       ['60次/月 完整构建', '5智能体3D协同工作室', '团队共享代码库', '10GB专属知识库', '优先支持'],
  enterprise: ['无限制构建', '14智能体全量3D编排', '私有化/VPC部署', 'SAML/OIDC SSO', '99.9% SLA', '专属客服'],
};

export default function SubscriptionPage() {
  const { t } = useI18n();
  const { data: sub, isLoading, refetch } = trpc.subscription.get.useQuery();
  const upgrade = trpc.subscription.upgrade.useMutation({
    onSuccess: () => { refetch(); toast.success('套餐已升级！'); },
    onError: e => toast.error(e.message),
  });

  const currentTier = sub?.tier || 'free';
  const tierOrder = ['free', 'pro', 'team', 'enterprise'] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/20 border border-[var(--warning)]/30 flex items-center justify-center">
          <CreditCard size={20} className="text-[var(--warning)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t('subscription_title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">选择适合您的套餐，解锁更多 AI 能力</p>
        </div>
      </motion.div>

      {/* Current Plan Banner */}
      {!isLoading && sub && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-[var(--warning)]" />
              <div>
                <div className="text-sm font-bold text-white">
                  当前套餐: <span className="text-[var(--brand-light)]">{SUBSCRIPTION_TIERS[currentTier].name}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  已使用 {sub.buildsUsed} / {sub.buildsLimit === 9999 ? '无限制' : sub.buildsLimit} 次构建
                </div>
              </div>
            </div>
            {/* Usage bar */}
            <div className="w-48">
              <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div
                  className="progress-brand h-full"
                  style={{ width: `${Math.min(100, (sub.buildsUsed / (sub.buildsLimit || 1)) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1 text-right">
                {sub.buildsLimit === 9999 ? '无限制' : `剩余 ${sub.buildsLimit - sub.buildsUsed} 次`}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {tierOrder.map((tier, i) => {
          const info = SUBSCRIPTION_TIERS[tier];
          const features = TIER_FEATURES[tier];
          const isCurrent = currentTier === tier;
          const isHigher = tierOrder.indexOf(tier) > tierOrder.indexOf(currentTier);

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`feature-card relative flex flex-col ${isCurrent ? 'border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/5' : ''} ${tier === 'team' ? 'ring-1 ring-[var(--success)]/40' : ''}`}
            >
              {tier === 'team' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--success)] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                  推荐
                </div>
              )}

              <div className="mb-4">
                <div className="text-sm font-bold text-[var(--text-primary)] mb-1">{info.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold" style={{ color: info.color }}>
                    {info.price === 0 ? '免费' : `¥${info.price}`}
                  </span>
                  {info.price > 0 && <span className="text-xs text-[var(--text-muted)]">/月</span>}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  {info.buildsLimit === 9999 ? '无限制构建' : `${info.buildsLimit}次/月 构建`}
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-5">
                {features.map((feat, fi) => (
                  <div key={fi} className="flex items-start gap-2 text-xs">
                    <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: info.color }} />
                    <span className="text-[var(--text-secondary)]">{feat}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => !isCurrent && upgrade.mutate({ tier })}
                disabled={isCurrent || upgrade.isPending}
                className={`w-full h-9 text-sm font-semibold ${isCurrent ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-default' : 'btn-brand'}`}
                style={isCurrent ? {} : { background: `linear-gradient(135deg, ${info.color}cc, ${info.color})` }}
              >
                {upgrade.isPending ? <Loader2 size={14} className="animate-spin" /> :
                 isCurrent ? '当前套餐' : isHigher ? '升级' : '降级'}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Bazaar Entry */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-5 border-[var(--warning)]/20"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/20 border border-[var(--warning)]/30 flex items-center justify-center">
              <Zap size={20} className="text-[var(--warning)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">智能体技能市场 Bazaar</h3>
              <p className="text-xs text-[var(--text-secondary)]">购买/出售自定义 Agent 技能包，平台抽取 30% 佣金</p>
            </div>
          </div>
          <Button variant="outline" className="border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10 h-9 text-sm gap-2">
            <Zap size={14} /> 进入市场
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
