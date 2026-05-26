import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  LayoutDashboard, Users, Settings, CreditCard, Bell,
  Activity, ShieldCheck, BarChart3, Loader2, TrendingUp,
  Package, Wrench, ChevronRight, LogOut, Home
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ADMIN_NAV = [
  { path: '/admin', label: '数据看板', icon: LayoutDashboard },
  { path: '/admin/users', label: '用户管理', icon: Users },
  { path: '/admin/orders', label: '支付订单', icon: CreditCard },
  { path: '/admin/builds', label: '构建监控', icon: Activity },
  { path: '/admin/settings', label: '系统设置', icon: Settings },
  { path: '/admin/announcements', label: '公告管理', icon: Bell },
];

const TIER_COLORS = { free: '#475569', pro: '#818CF8', team: '#38BDF8', enterprise: '#F59E0B' };

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#0D0D16] border-r border-[var(--border-subtle)] flex flex-col">
        <div className="px-4 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-0.5">
            <ShieldCheck size={16} className="text-[var(--warning)]" />
            <span className="text-sm font-bold text-white">管理后台</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Agentic Factory OS</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(item => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${isActive ? 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white'}`}>
                  <Icon size={14} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[var(--border-subtle)] space-y-1">
          <Link href="/">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] cursor-pointer transition-all">
              <Home size={13} /> 返回前台
            </div>
          </Link>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--error)] hover:bg-[var(--error)]/10 w-full transition-all">
            <LogOut size={13} /> 退出登录
          </button>
        </div>
      </aside>
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div key={location} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = trpc.admin.dashboard.useQuery();

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin text-[var(--warning)]" />
    </div>
  );

  const buildChartData = (stats?.buildsByDay || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('zh', { month: 'short', day: 'numeric' }),
    count: Number(d.count),
  }));

  const tierData = (stats?.tierDistribution || []).map((d: any) => ({
    name: d.subscriptionTier,
    value: Number(d.count),
    color: TIER_COLORS[d.subscriptionTier as keyof typeof TIER_COLORS] || '#475569',
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={22} className="text-[var(--warning)]" />
        <div>
          <h1 className="text-xl font-bold text-white">数据看板</h1>
          <p className="text-xs text-[var(--text-muted)]">平台运营实时数据</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总用户数', value: stats?.users || 0, icon: Users, color: 'var(--brand-primary)', suffix: '人' },
          { label: '总构建次数', value: stats?.builds || 0, icon: Activity, color: 'var(--success)', suffix: '次' },
          { label: '累计收益', value: stats?.revenue || 0, icon: TrendingUp, color: 'var(--warning)', prefix: '¥' },
          { label: '7日活跃用户', value: stats?.activeUsers || 0, icon: BarChart3, color: 'var(--info)', suffix: '人' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                  <Icon size={18} style={{ color: kpi.color }} />
                </div>
                <div>
                  <div className="text-2xl font-extrabold" style={{ color: kpi.color }}>
                    {kpi.prefix}{Number(kpi.value).toLocaleString()}{kpi.suffix}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{kpi.label}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Build Trend */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">构建趋势（近14天）</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={buildChartData}>
              <defs>
                <linearGradient id="buildGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#15151D', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#7C5CFC" strokeWidth={2} fill="url(#buildGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">用户套餐分布</h3>
          {tierData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {tierData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v + ' 人', name]} contentStyle={{ background: '#15151D', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-xs">暂无数据</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(TIER_COLORS).map(([tier, color]) => (
              <div key={tier} className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {tier}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Builds */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[var(--success)]" /> 最近构建记录
        </h3>
        <div className="space-y-2">
          {(stats?.recentBuilds || []).map((b: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-all">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === 'success' ? 'bg-[var(--success)]' : b.status === 'failed' ? 'bg-[var(--error)]' : b.status === 'running' ? 'bg-[var(--warning)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--text-primary)] truncate">{b.prompt?.slice(0, 60)}...</div>
                <div className="text-[10px] text-[var(--text-muted)]">{b.userName || '未知用户'} · {new Date(b.createdAt).toLocaleString()}</div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{
                color: b.status === 'success' ? 'var(--success)' : b.status === 'failed' ? 'var(--error)' : 'var(--warning)',
                background: b.status === 'success' ? 'rgba(56,189,248,0.1)' : b.status === 'failed' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
              }}>{b.status}</span>
            </div>
          ))}
          {(!stats?.recentBuilds || stats.recentBuilds.length === 0) && (
            <div className="text-xs text-[var(--text-muted)] text-center py-4">暂无构建记录</div>
          )}
        </div>
      </div>
    </div>
  );
}
