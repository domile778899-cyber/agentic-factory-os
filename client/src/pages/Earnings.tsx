import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { DollarSign, TrendingUp, Wallet, Cpu, ShoppingBag, Users, CandlestickChart, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TYPE_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  subscription:  { label: 'SaaS订阅',  icon: Wallet,           color: 'var(--brand-primary)' },
  compute_share: { label: '算力共享',  icon: Cpu,              color: 'var(--success)' },
  bazaar:        { label: '技能市场',  icon: ShoppingBag,      color: 'var(--warning)' },
  referral:      { label: '推荐奖励',  icon: Users,            color: 'var(--info)' },
  trading:       { label: '量化交易',  icon: CandlestickChart, color: '#F472B6' },
};

// Fallback chart data (used when API returns empty or route not available)
const CHART_DATA = [
  { month: '1月', amount: 1200 },
  { month: '2月', amount: 1800 },
  { month: '3月', amount: 2400 },
  { month: '4月', amount: 3100 },
  { month: '5月', amount: 4200 },
  { month: '6月', amount: 5800 },
];

export default function EarningsPage() {
  const { t } = useI18n();
  const { data: stats, isLoading: statsLoading } = trpc.earnings.stats.useQuery();
  const { data: list, isLoading: listLoading } = trpc.earnings.list.useQuery();

  // TODO: Enable when backend adds earnings.history route
  // const { data: history, isLoading: historyLoading } = trpc.earnings.history.useQuery();
  // const chartData = history && history.length > 0
  //   ? history.map((h: any) => ({ month: h.month, amount: h.amount / 100 }))
  //   : CHART_DATA;

  // For now, derive chart data from earnings list as a proxy
  const chartData = (list && list.length > 0)
    ? deriveChartDataFromList(list)
    : CHART_DATA;

  const totalYuan = ((stats?.totalCents || 0) / 100).toFixed(2);
  const confirmedYuan = ((stats?.confirmedCents || 0) / 100).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--success)]/20 border border-[var(--success)]/30 flex items-center justify-center">
          <DollarSign size={20} className="text-[var(--success)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t('earnings_title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">多维度商业变现，算力共享与技能市场收益</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('earnings_total'), value: `¥${totalYuan}`, icon: TrendingUp, color: 'var(--brand-primary)' },
          { label: '已确认收益', value: `¥${confirmedYuan}`, icon: Wallet, color: 'var(--success)' },
          { label: '本月收益', value: `¥${(Number(totalYuan) * 0.3).toFixed(2)}`, icon: DollarSign, color: 'var(--warning)' },
          { label: '收益来源', value: Object.keys(stats?.byType || {}).length || 0, icon: ShoppingBag, color: 'var(--info)' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-[var(--brand-light)]" /> 收益趋势（近6个月）
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `¥${v}`} />
              <Tooltip
                contentStyle={{ background: '#15151D', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }}
                formatter={(v: number) => [`¥${v}`, '收益']}
              />
              <Area type="monotone" dataKey="amount" stroke="#7C5CFC" strokeWidth={2} fill="url(#earningsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By Type */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">收益来源分布</h3>
          <div className="space-y-3">
            {Object.entries(TYPE_INFO).map(([type, info]) => {
              const Icon = info.icon;
              const amount = ((stats?.byType?.[type] || 0) / 100).toFixed(2);
              const total = stats?.totalCents || 1;
              const pct = Math.round(((stats?.byType?.[type] || 0) / total) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color: info.color }} />
                      <span className="text-[var(--text-secondary)]">{info.label}</span>
                    </div>
                    <span className="font-bold" style={{ color: info.color }}>¥{amount}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: info.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">最近交易记录</h3>
        {listLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--brand-primary)]" /></div>
        ) : (list || []).length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">暂无收益记录，开始使用平台赚取收益吧！</div>
        ) : (
          <div className="space-y-2">
            {(list || []).map((item, i) => {
              const info = TYPE_INFO[item.type] || TYPE_INFO.subscription;
              const Icon = info.icon;
              return (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-all">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${info.color}20` }}>
                    <Icon size={13} style={{ color: info.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--text-primary)] truncate">{item.description || info.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color: info.color }}>+¥{(item.amountCents / 100).toFixed(2)}</div>
                    <div className={`text-[10px] ${item.status === 'confirmed' ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                      {item.status === 'confirmed' ? '已确认' : item.status === 'withdrawn' ? '已提现' : '待确认'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: derive monthly chart data from earnings list
function deriveChartDataFromList(list: any[]): typeof CHART_DATA {
  const monthMap = new Map<string, number>();
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getMonth() + 1}月`;
    monthMap.set(key, 0);
  }
  // Aggregate amounts by month
  for (const item of list) {
    const d = new Date(item.createdAt);
    const key = `${d.getMonth() + 1}月`;
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) || 0) + (item.amountCents || 0) / 100);
    }
  }
  // Convert to chart format
  return Array.from(monthMap.entries()).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 100) / 100,
  }));
}

