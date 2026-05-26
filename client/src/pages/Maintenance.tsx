import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { Shield, AlertTriangle, CheckCircle2, GitBranch, Loader2, Eye, X, Wrench, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SEVERITY_LABELS } from '@shared/types';

export default function MaintenancePage() {
  const { t } = useI18n();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: bugs, isLoading: bugsLoading, refetch: refetchBugs } = trpc.maintenance.bugReports.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: proposals, isLoading: prLoading, refetch: refetchProposals } = trpc.maintenance.fixProposals.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const approveFix = trpc.maintenance.approveFix.useMutation({
    onSuccess: () => { toast.success('修复 PR 已批准合并！'); refetchProposals(); refetchBugs(); },
    onError: e => toast.error(e.message),
  });
  const dismissBug = trpc.maintenance.dismissBug.useMutation({
    onSuccess: () => { toast.success('已忽略该缺陷'); refetchBugs(); },
  });
  const generateFix = trpc.maintenance.generateFix.useMutation({
    onSuccess: () => { toast.success('修复方案已生成！'); refetchProposals(); refetchBugs(); },
    onError: e => toast.error(e.message),
  });

  const openBugs = (bugs || []).filter(b => b.status === 'open');
  const criticalCount = openBugs.filter(b => b.severity === 'critical').length;
  const highCount = openBugs.filter(b => b.severity === 'high').length;

  // Auto-select first project
  if (!selectedProjectId && projects && projects.length > 0) {
    setSelectedProjectId(projects[0].id);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--error)]/20 border border-[var(--error)]/30 flex items-center justify-center">
            <Shield size={20} className="text-[var(--error)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('maintenance_title')}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{t('maintenance_subtitle')}</p>
          </div>
        </div>
        {/* Project selector */}
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-[var(--text-muted)]" />
          <select
            value={selectedProjectId || ''}
            onChange={e => setSelectedProjectId(Number(e.target.value))}
            className="input-dark text-sm h-9 w-48"
          >
            <option value="">选择项目</option>
            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '严重缺陷', value: criticalCount, color: 'var(--error)' },
          { label: '高危缺陷', value: highCount, color: 'var(--warning)' },
          { label: '待修复', value: openBugs.length, color: 'var(--info)' },
          { label: '待审批 PR', value: (proposals || []).filter(p => p.status === 'pending').length, color: 'var(--success)' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center">
            <div className="text-3xl font-extrabold mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-[var(--text-secondary)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bug Reports */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-[var(--warning)]" /> 代码缺陷扫描结果
            {bugsLoading && <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />}
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {(bugs || []).filter(b => b.status !== 'dismissed').map((bug, i) => {
              const sev = SEVERITY_LABELS[bug.severity] || SEVERITY_LABELS.low;
              return (
                <motion.div key={bug.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: sev.color, background: `${sev.color}20` }}>
                        {sev.zh}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">{bug.category}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        bug.status === 'fixed' ? 'text-[var(--success)] bg-[var(--success)]/10' :
                        bug.status === 'fixing' ? 'text-[var(--warning)] bg-[var(--warning)]/10' :
                        'text-[var(--text-muted)] bg-[var(--bg-elevated)]'
                      }`}>{bug.status === 'fixed' ? '已修复' : bug.status === 'fixing' ? '修复中' : '待处理'}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {bug.status === 'open' && (
                        <>
                          <button
                            onClick={() => generateFix.mutate({ bugId: bug.id, projectId: bug.projectId, description: bug.description })}
                            disabled={generateFix.isPending}
                            className="p-1.5 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-light)] hover:bg-[var(--brand-primary)]/20 transition-all"
                            title="生成修复"
                          >
                            {generateFix.isPending ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
                          </button>
                          <button
                            onClick={() => dismissBug.mutate({ bugId: bug.id })}
                            className="p-1.5 rounded-lg bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-all"
                            title="忽略"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] mb-1">{bug.description}</p>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">{bug.file}{bug.line ? `:${bug.line}` : ''}</div>
                  {bug.suggestion && (
                    <div className="mt-2 text-[10px] text-[var(--success)] bg-[var(--success)]/5 border border-[var(--success)]/20 rounded-lg px-2 py-1.5">
                      💡 {bug.suggestion}
                    </div>
                  )}
                </motion.div>
              );
            })}
            {!selectedProjectId && <div className="text-xs text-[var(--text-muted)] text-center py-8">请先选择一个项目</div>}
            {selectedProjectId && !bugsLoading && (bugs || []).length === 0 && (
              <div className="text-xs text-[var(--success)] text-center py-8 flex flex-col items-center gap-2">
                <CheckCircle2 size={24} />
                未发现代码缺陷，代码质量优秀！
              </div>
            )}
          </div>
        </div>

        {/* Fix Proposals */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <GitBranch size={15} className="text-[var(--success)]" /> 自动修复 PR 列表
            {prLoading && <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />}
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {(proposals || []).map((pr, i) => (
              <motion.div key={pr.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{pr.title}</div>
                    {pr.branchName && (
                      <div className="text-[10px] text-[var(--brand-light)] font-mono mt-0.5">{pr.branchName}</div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                    pr.status === 'approved' ? 'badge-success' :
                    pr.status === 'merged'   ? 'text-[var(--brand-light)] bg-[var(--brand-primary)]/20' :
                    pr.status === 'rejected' ? 'badge-error' :
                    'badge-warning'
                  }`}>
                    {pr.status === 'approved' ? '已批准' : pr.status === 'merged' ? '已合并' : pr.status === 'rejected' ? '已拒绝' : '待审批'}
                  </span>
                </div>
                {pr.description && <p className="text-[10px] text-[var(--text-secondary)] mb-2 line-clamp-2">{pr.description}</p>}
                <div className="text-[10px] text-[var(--text-muted)] mb-3">{new Date(pr.createdAt).toLocaleString()}</div>
                {pr.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveFix.mutate({ proposalId: pr.id })}
                      disabled={approveFix.isPending}
                      className="btn-brand h-7 text-xs gap-1 flex-1"
                    >
                      {approveFix.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                      {t('maintenance_approve')}
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
            {!selectedProjectId && <div className="text-xs text-[var(--text-muted)] text-center py-8">请先选择一个项目</div>}
            {selectedProjectId && !prLoading && (proposals || []).length === 0 && (
              <div className="text-xs text-[var(--text-muted)] text-center py-8">暂无待审批的修复 PR</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
