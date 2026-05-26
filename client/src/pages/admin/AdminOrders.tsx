import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { CreditCard, Plus, Loader2, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TIER_COLORS = { pro: '#818CF8', team: '#38BDF8', enterprise: '#F59E0B' };
const STATUS_COLORS = { pending: '#94A3B8', paid: '#34D399', failed: '#F43F5E', refunded: '#F59E0B' };

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ userId: '', tier: 'pro', amountCents: 9900, note: '' });

  const { data, isLoading, refetch } = trpc.admin.orders.list.useQuery({ page });
  const manualPay = trpc.admin.orders.manualPay.useMutation({
    onSuccess: (d) => { refetch(); setShowManual(false); toast.success(`手动支付成功！订单号: ${d.orderId}`); },
    onError: e => toast.error(e.message),
  });

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard size={20} className="text-[var(--warning)]" />
          <div>
            <h1 className="text-xl font-bold text-white">支付订单</h1>
            <p className="text-xs text-[var(--text-muted)]">共 {total} 笔订单</p>
          </div>
        </div>
        <Button onClick={() => setShowManual(true)} className="btn-brand gap-2 h-9">
          <Plus size={14} /> 手动开通套餐
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['订单号', '用户', '套餐', '金额', '支付方式', '状态', '时间'].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.list || []).map((order: any, i: number) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-4 py-3 text-[10px] text-[var(--text-muted)] font-mono">{order.orderId?.slice(0, 20)}...</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-primary)]">{order.userName || order.userEmail || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: TIER_COLORS[order.tier as keyof typeof TIER_COLORS] || '#475569', background: `${TIER_COLORS[order.tier as keyof typeof TIER_COLORS] || '#475569'}20` }}>
                      {order.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-[var(--success)]">¥{(order.amount / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{order.paymentMethod || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#94A3B8', background: `${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#94A3B8'}20` }}>
                      {order.status === 'paid' ? '已支付' : order.status === 'pending' ? '待支付' : order.status === 'failed' ? '失败' : '已退款'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(order.createdAt).toLocaleString('zh')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {(data?.list || []).length === 0 && (
            <div className="text-center py-10 text-xs text-[var(--text-muted)]">暂无订单记录</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs gap-1 text-[var(--text-secondary)]"><ChevronLeft size={12} /> 上一页</Button>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7 text-xs gap-1 text-[var(--text-secondary)]">下一页 <ChevronRight size={12} /></Button>
          </div>
        </div>
      )}

      {/* Manual Pay Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign size={18} className="text-[var(--success)]" />
              <h3 className="text-sm font-bold text-white">手动开通套餐</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">用户 ID *</label>
                <Input value={manualForm.userId} onChange={e => setManualForm(f => ({ ...f, userId: e.target.value }))} placeholder="输入用户 ID" className="input-dark" type="number" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">套餐</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pro', 'team', 'enterprise'] as const).map(t => (
                    <button key={t} onClick={() => setManualForm(f => ({ ...f, tier: t }))}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${manualForm.tier === t ? 'text-white border-transparent' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'}`}
                      style={manualForm.tier === t ? { background: TIER_COLORS[t], borderColor: TIER_COLORS[t] } : {}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">金额（分）</label>
                <Input value={manualForm.amountCents} onChange={e => setManualForm(f => ({ ...f, amountCents: Number(e.target.value) }))} className="input-dark" type="number" />
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">= ¥{(manualForm.amountCents / 100).toFixed(2)}</div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">备注</label>
                <Input value={manualForm.note} onChange={e => setManualForm(f => ({ ...f, note: e.target.value }))} placeholder="例如：线下转账开通" className="input-dark" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="ghost" size="sm" onClick={() => setShowManual(false)} className="text-[var(--text-secondary)]">取消</Button>
              <Button size="sm" onClick={() => manualPay.mutate({ userId: Number(manualForm.userId), tier: manualForm.tier as any, amountCents: manualForm.amountCents, note: manualForm.note })}
                disabled={!manualForm.userId || manualPay.isPending} className="btn-brand gap-1">
                {manualPay.isPending ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                确认开通
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
