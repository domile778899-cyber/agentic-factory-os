import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Plug, Plus, Zap, Wifi, WifiOff, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const TRANSPORT_COLORS = { sse: 'var(--success)', stdio: 'var(--warning)', http: 'var(--info)' };

export default function MCPPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string; endpoint: string; transport: 'sse' | 'stdio' | 'http' }>({ name: '', description: '', endpoint: '', transport: 'sse' });

  const { data: servers, isLoading, refetch } = trpc.lobe.mcp.list.useQuery();
  const toggleServer = trpc.lobe.mcp.toggle.useMutation({ onSuccess: () => { refetch(); } });
  const connectServer = trpc.lobe.mcp.connect.useMutation({
    onSuccess: () => { refetch(); toast.success('MCP 服务器连接成功！'); },
    onError: e => toast.error(e.message),
  });
  const addServer = trpc.lobe.mcp.add.useMutation({
    onSuccess: () => { refetch(); setShowAdd(false); toast.success('MCP 服务器已添加！'); },
  });

  const connectedCount = (servers || []).filter((s: any) => s.status === 'connected').length;
  const totalTools = (servers || []).reduce((sum: number, s: any) => sum + (s.toolsCount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--success)]/20 border border-[var(--success)]/30 flex items-center justify-center">
            <Plug size={20} className="text-[var(--success)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">MCP 集成</h1>
            <p className="text-sm text-[var(--text-secondary)]">Model Context Protocol 服务器管理</p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)} className="btn-brand gap-2 h-9">
          <Plus size={14} /> 添加服务器
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '已连接', value: connectedCount, color: 'var(--success)' },
          { label: '可用工具', value: totalTools, color: 'var(--brand-light)' },
          { label: '服务器总数', value: (servers || []).length, color: 'var(--info)' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center">
            <div className="text-3xl font-extrabold mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-[var(--text-secondary)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Server List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <div className="space-y-3">
          {(servers || []).map((server: any, i: number) => {
            const tc = TRANSPORT_COLORS[server.transport as keyof typeof TRANSPORT_COLORS] || 'var(--text-muted)';
            return (
              <motion.div key={server.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="feature-card">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
                    {server.status === 'connected' ? <Wifi size={18} className="text-[var(--success)]" /> : <WifiOff size={18} className="text-[var(--text-muted)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{server.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: tc, background: `${tc}20` }}>{server.transport?.toUpperCase()}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${server.status === 'connected' ? 'badge-success' : 'text-[var(--text-muted)] bg-[var(--bg-elevated)]'}`}>
                        {server.status === 'connected' ? '已连接' : '未连接'}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{server.description}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 truncate">{server.endpoint}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[var(--brand-light)]">{server.toolsCount}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">工具</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[var(--text-secondary)]">{(server.callsCount || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">调用</div>
                    </div>
                    <div className="flex gap-1.5">
                      {server.status !== 'connected' && (
                        <Button size="sm" onClick={() => connectServer.mutate({ id: server.id })} disabled={connectServer.isPending} className="btn-brand h-7 text-xs px-2 gap-1">
                          {connectServer.isPending ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                          连接
                        </Button>
                      )}
                      <button onClick={() => toggleServer.mutate({ id: server.id, enabled: !server.enabled })}
                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${server.enabled ? 'border-[var(--success)]/30 text-[var(--success)] bg-[var(--success)]/10' : 'border-[var(--border-default)] text-[var(--text-muted)]'}`}>
                        {server.enabled ? '启用' : '禁用'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Server Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="glass-card w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white">添加 MCP 服务器</h2>
                  <button onClick={() => setShowAdd(false)} className="text-[var(--text-muted)] hover:text-white"><X size={18} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">服务器名称 *</label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：My Search Server" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">描述</label>
                    <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="这个服务器提供什么功能？" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">端点地址 *</label>
                    <Input value={form.endpoint} onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))} placeholder="https://mcp.example.com/sse" className="input-dark font-mono text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">传输协议</label>
                    <div className="flex gap-2">
                      {(['sse', 'stdio', 'http'] as const).map(t => (
                        <button key={t} onClick={() => setForm(f => ({ ...f, transport: t }))}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all uppercase ${form.transport === t ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-5">
                  <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="text-[var(--text-secondary)]">取消</Button>
                  <Button size="sm" onClick={() => addServer.mutate(form)} disabled={!form.name || !form.endpoint || addServer.isPending} className="btn-brand gap-1">
                    {addServer.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    添加
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
