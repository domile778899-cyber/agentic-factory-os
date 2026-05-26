import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import { FolderOpen, Plus, Loader2, Archive, Activity, GitBranch, Database, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const { t } = useI18n();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => { toast.success('项目已创建！'); refetch(); setShowCreate(false); setNewName(''); setNewDesc(''); },
    onError: e => toast.error(e.message),
  });
  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => { refetch(); toast.success('项目已更新'); },
  });

  const statusColors: Record<string, string> = {
    active:   'var(--success)',
    archived: 'var(--text-muted)',
    building: 'var(--warning)',
  };
  const statusLabels: Record<string, string> = {
    active: '活跃', archived: '已归档', building: '构建中',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/30 flex items-center justify-center">
            <FolderOpen size={20} className="text-[var(--brand-light)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('projects_title')}</h1>
            <p className="text-sm text-[var(--text-secondary)]">多租户隔离，每个项目拥有独立知识库与构建历史</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="btn-brand gap-2 h-9">
          <Plus size={15} /> {t('projects_create')}
        </Button>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 border-[var(--brand-primary)]/30"
          >
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">新建项目</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">项目名称 *</label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：任务管理系统"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">项目描述</label>
                <Input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="简要描述项目用途..."
                  className="input-dark"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-[var(--text-secondary)] gap-1">
                <X size={13} /> 取消
              </Button>
              <Button
                size="sm"
                onClick={() => createProject.mutate({ name: newName, description: newDesc })}
                disabled={!newName.trim() || createProject.isPending}
                className="btn-brand gap-1"
              >
                {createProject.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                创建
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(projects || []).map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="feature-card group"
            >
              {/* Status indicator */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/25 flex items-center justify-center">
                  <FolderOpen size={18} className="text-[var(--brand-light)]" />
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: statusColors[project.status], background: `${statusColors[project.status]}20` }}
                >
                  {statusLabels[project.status]}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 truncate">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{project.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                  <div className="text-sm font-bold text-[var(--brand-light)]">{project.buildCount}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">构建次数</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                  <div className="text-sm font-bold text-[var(--success)]">{project.knowledgeBaseSize}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">知识库</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                  <div className="text-sm font-bold text-[var(--info)]">
                    {new Date(project.createdAt).toLocaleDateString('zh', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">创建日期</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-7 text-xs text-[var(--text-secondary)] hover:text-[var(--brand-light)] gap-1"
                  onClick={() => updateProject.mutate({ id: project.id, status: project.status === 'active' ? 'archived' : 'active' })}
                >
                  <Archive size={11} />
                  {project.status === 'active' ? '归档' : '激活'}
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-[var(--text-secondary)] hover:text-[var(--success)] gap-1">
                  <Activity size={11} /> 查看构建
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Empty state */}
          {(!projects || projects.length === 0) && (
            <div className="col-span-full text-center py-16">
              <FolderOpen size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)] mb-4">还没有项目，创建第一个吧！</p>
              <Button onClick={() => setShowCreate(true)} className="btn-brand gap-2">
                <Plus size={15} /> 新建项目
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
