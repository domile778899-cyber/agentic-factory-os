import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Activity, Loader2, ChevronLeft, ChevronRight, Bell, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  pending: '#94A3B8', running: '#38BDF8', success: '#34D399', failed: '#F43F5E', cancelled: '#F59E0B'
};

export function AdminBuildsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = trpc.admin.builds.list.useQuery({ page, status: statusFilter || undefined });
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-[var(--success)]" />
          <div>
            <h1 className="text-xl font-bold text-white">构建监控</h1>
            <p className="text-xs text-[var(--text-muted)]">共 {total} 次构建</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['', 'running', 'success', 'failed'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]'}`}>
              {s === '' ? '全部' : s === 'running' ? '运行中' : s === 'success' ? '成功' : '失败'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['ID', '用户', '需求摘要', '状态', '耗时', '时间'].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.list || []).map((b: any, i: number) => (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono">#{b.id}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-primary)]">{b.userName || '-'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)] max-w-xs truncate">{b.prompt?.slice(0, 60)}...</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: STATUS_COLORS[b.status] || '#94A3B8', background: `${STATUS_COLORS[b.status] || '#94A3B8'}20` }}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{b.durationMs ? `${(b.durationMs / 1000).toFixed(1)}s` : '-'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(b.createdAt).toLocaleString('zh')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {(data?.list || []).length === 0 && <div className="text-center py-10 text-xs text-[var(--text-muted)]">暂无构建记录</div>}
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
    </div>
  );
}

export function AdminAnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{ title: string; content: string; type: 'info' | 'warning' | 'success' | 'error' }>({ title: '', content: '', type: 'info' });
  const { data, isLoading, refetch } = trpc.admin.announcements.list.useQuery();
  const create = trpc.admin.announcements.create.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); toast.success('公告已创建！'); } });
  const toggle = trpc.admin.announcements.toggle.useMutation({ onSuccess: () => refetch() });

  const TYPE_COLORS = { info: 'var(--info)', warning: 'var(--warning)', success: 'var(--success)', error: 'var(--error)' };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-[var(--info)]" />
          <h1 className="text-xl font-bold text-white">公告管理</h1>
        </div>
        <Button onClick={() => setShowCreate(true)} className="btn-brand gap-2 h-9"><Plus size={14} /> 新建公告</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <div className="space-y-3">
          {(data || []).map((ann: any, i: number) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="feature-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: TYPE_COLORS[ann.type as keyof typeof TYPE_COLORS] || 'var(--info)' }} />
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{ann.title}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">{ann.content}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(ann.createdAt).toLocaleString('zh')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ann.isActive ? 'badge-success' : 'text-[var(--text-muted)] bg-[var(--bg-elevated)]'}`}>
                    {ann.isActive ? '已发布' : '已下线'}
                  </span>
                  <button onClick={() => toggle.mutate({ id: ann.id, isActive: !ann.isActive })}
                    className="text-xs px-2 py-1 rounded border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-white transition-all">
                    {ann.isActive ? '下线' : '发布'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {(!data || data.length === 0) && <div className="text-center py-10 text-xs text-[var(--text-muted)]">暂无公告</div>}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">新建公告</h3>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">标题</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-dark" placeholder="公告标题" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">内容</label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input-dark resize-none" rows={3} placeholder="公告内容..." />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">类型</label>
                <div className="flex gap-2">
                  {(['info', 'warning', 'success', 'error'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.type === t ? 'text-white border-transparent' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'}`}
                      style={form.type === t ? { background: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : {}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-[var(--text-secondary)]">取消</Button>
              <Button size="sm" onClick={() => create.mutate(form)} disabled={!form.title || !form.content || create.isPending} className="btn-brand gap-1">
                {create.isPending ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                发布
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
