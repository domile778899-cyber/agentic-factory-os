import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Users, Search, Shield, CreditCard, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TIER_COLORS = { free: '#475569', pro: '#818CF8', team: '#38BDF8', enterprise: '#F59E0B' };
const TIER_LABELS = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newTier, setNewTier] = useState('pro');
  const [creditsAmount, setCreditsAmount] = useState(10);

  const { data, isLoading, refetch } = trpc.admin.users.list.useQuery({ page, search });
  const setRole = trpc.admin.users.setRole.useMutation({ onSuccess: () => { refetch(); toast.success('角色已更新'); } });
  const setSub = trpc.admin.users.setSubscription.useMutation({ onSuccess: () => { refetch(); toast.success('订阅已更新'); setEditingUser(null); } });
  const addCredits = trpc.admin.users.addCredits.useMutation({ onSuccess: () => { refetch(); toast.success('额度已增加'); } });

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-[var(--brand-light)]" />
          <div>
            <h1 className="text-xl font-bold text-white">用户管理</h1>
            <p className="text-xs text-[var(--text-muted)]">共 {total} 名用户</p>
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="搜索用户名/邮箱..." className="pl-8 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] w-52 h-9 text-sm" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['用户', '邮箱', '角色', '套餐', '构建使用', '注册时间', '操作'].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.list || []).map((user: any, i: number) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.name?.[0] || 'U'}
                      </div>
                      <span className="text-xs text-[var(--text-primary)] font-medium">{user.name || '未设置'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{user.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-[var(--warning)]/15 text-[var(--warning)]' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                      {user.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: TIER_COLORS[user.subscriptionTier as keyof typeof TIER_COLORS] || '#475569', background: `${TIER_COLORS[user.subscriptionTier as keyof typeof TIER_COLORS] || '#475569'}20` }}>
                      {TIER_LABELS[user.subscriptionTier as keyof typeof TIER_LABELS] || 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {user.buildsUsed || 0} / {user.buildsLimit === 9999 ? '∞' : user.buildsLimit || 2}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {new Date(user.createdAt).toLocaleDateString('zh')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setRole.mutate({ userId: user.id, role: user.role === 'admin' ? 'user' : 'admin' })}
                        className="p-1.5 rounded bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)]/20 transition-all" title="切换角色">
                        <Shield size={11} />
                      </button>
                      <button onClick={() => setEditingUser(user)}
                        className="p-1.5 rounded bg-[var(--brand-primary)]/10 text-[var(--brand-light)] hover:bg-[var(--brand-primary)]/20 transition-all" title="管理订阅">
                        <CreditCard size={11} />
                      </button>
                      <button onClick={() => addCredits.mutate({ userId: user.id, builds: 10 })}
                        className="p-1.5 rounded bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 transition-all" title="增加10次额度">
                        <Plus size={11} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {(data?.list || []).length === 0 && (
            <div className="text-center py-10 text-xs text-[var(--text-muted)]">暂无用户数据</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs gap-1 text-[var(--text-secondary)]">
              <ChevronLeft size={12} /> 上一页
            </Button>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7 text-xs gap-1 text-[var(--text-secondary)]">
              下一页 <ChevronRight size={12} />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-white mb-4">管理订阅 — {editingUser.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-2 block">套餐等级</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['free', 'pro', 'team', 'enterprise'] as const).map(t => (
                    <button key={t} onClick={() => setNewTier(t)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${newTier === t ? 'text-white border-transparent' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'}`}
                      style={newTier === t ? { background: TIER_COLORS[t], borderColor: TIER_COLORS[t] } : {}}>
                      {TIER_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">增加额度</label>
                <div className="flex gap-2">
                  <Input type="number" value={creditsAmount} onChange={e => setCreditsAmount(Number(e.target.value))} className="input-dark flex-1" min={1} max={9999} />
                  <Button size="sm" onClick={() => addCredits.mutate({ userId: editingUser.id, builds: creditsAmount })} className="btn-brand h-9 px-3 gap-1">
                    <Plus size={12} /> 增加
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)} className="text-[var(--text-secondary)]">取消</Button>
              <Button size="sm" onClick={() => setSub.mutate({ userId: editingUser.id, tier: newTier as any })} disabled={setSub.isPending} className="btn-brand gap-1">
                {setSub.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
