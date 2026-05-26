import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import {
  Factory, Send, Loader2, CheckCircle2, XCircle,
  Clock, ChevronDown, FolderOpen, Zap, Bot, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { BUILD_STATUS_LABELS } from '@shared/types';

const EXAMPLE_PROMPTS = [
  '构建一个带用户认证的任务管理系统，支持团队协作和实时通知',
  '开发一个 AI 驱动的电商推荐引擎，集成支付宝和微信支付',
  '创建一个加密货币量化交易平台，支持 OKX 和 Binance API',
  '构建一个多租户 SaaS 后台管理系统，包含权限管理和数据分析',
];

export default function FactoryPage() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeBuildId, setActiveBuildId] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: builds, refetch: refetchBuilds } = trpc.factory.builds.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject }
  );
  const { data: logs, refetch: refetchLogs } = trpc.factory.buildLogs.useQuery(
    { buildId: activeBuildId! },
    { enabled: !!activeBuildId, refetchInterval: polling ? 1000 : false }
  );

  const startBuild = trpc.factory.startBuild.useMutation({
    onSuccess: (data) => {
      setActiveBuildId(data.buildId);
      setPolling(true);
      toast.success('构建任务已启动！');
    },
    onError: (e) => toast.error(e.message),
  });

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success('项目已创建');
      setSelectedProject((data as any).insertId || 1);
    },
  });

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Stop polling when build completes
  useEffect(() => {
    if (!logs) return;
    const last = logs[logs.length - 1];
    if (last && (last.message.includes('构建完成') || last.message.includes('构建失败'))) {
      setPolling(false);
      refetchBuilds();
    }
  }, [logs]);

  const handleBuild = async () => {
    if (!prompt.trim()) return toast.error('请输入构建需求');
    let projId = selectedProject;
    if (!projId) {
      const r = await createProject.mutateAsync({ name: `项目-${Date.now()}`, description: prompt.slice(0, 100) });
      projId = (r as any).insertId || 1;
      setSelectedProject(projId);
    }
    await startBuild.mutateAsync({ projectId: projId!, prompt });
  };

  const getLevelClass = (level: string) => {
    const map: Record<string, string> = { info: 'log-info', warn: 'log-warn', error: 'log-error', step: 'log-step', success: 'log-success' };
    return map[level] || 'log-default';
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/30 flex items-center justify-center">
          <Factory size={20} className="text-[var(--brand-light)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t('factory_title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('factory_subtitle')}</p>
        </div>
      </motion.div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left: Input Panel */}
        <div className="flex flex-col gap-4">
          {/* Project Selector */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                <FolderOpen size={14} /> {t('factory_select_project')}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--brand-light)] hover:bg-[var(--brand-primary)]/10 h-7 text-xs gap-1"
                onClick={() => createProject.mutate({ name: `新项目-${Date.now()}` })}
              >
                <Plus size={12} /> 新建
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(projects || []).map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedProject === p.id
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-default)]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
              {(!projects || projects.length === 0) && (
                <span className="text-xs text-[var(--text-muted)]">暂无项目，将自动创建</span>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="glass-card p-4 flex-1 flex flex-col gap-3">
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={t('factory_input_placeholder')}
              className="flex-1 min-h-[160px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] resize-none text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleBuild(); }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{prompt.length}/5000 · Ctrl+Enter 快速构建</span>
              <Button
                onClick={handleBuild}
                disabled={startBuild.isPending || !prompt.trim()}
                className="btn-brand gap-2 h-9 px-5"
              >
                {startBuild.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {startBuild.isPending ? t('factory_building') : t('factory_start_build')}
              </Button>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="glass-card p-4">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-3 flex items-center gap-1">
              <Zap size={12} /> 示例需求
            </div>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="w-full text-left text-xs text-[var(--text-secondary)] hover:text-[var(--brand-light)] py-1.5 px-2 rounded hover:bg-[var(--brand-primary)]/10 transition-all truncate"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Build Log + History */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Build Log */}
          <div className="glass-card p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                <Bot size={14} /> {t('factory_build_log')}
              </span>
              {polling && (
                <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                  <Loader2 size={11} className="animate-spin" /> 构建中...
                </span>
              )}
            </div>
            <div className="terminal-log flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {(logs || []).map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`mb-0.5 ${getLevelClass(log.level)}`}
                  >
                    <span className="text-[var(--text-muted)] mr-2">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
              {(!logs || logs.length === 0) && (
                <div className="text-[var(--text-muted)] text-center py-8">
                  等待构建任务启动...
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Build History */}
          <div className="glass-card p-4">
            <div className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <Clock size={14} /> 构建历史
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(builds || []).map(b => {
                const statusInfo = BUILD_STATUS_LABELS[b.status] || BUILD_STATUS_LABELS.pending;
                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBuildId(b.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-[var(--bg-elevated)] ${activeBuildId === b.id ? 'bg-[var(--bg-elevated)] border border-[var(--border-hover)]' : ''}`}
                  >
                    {b.status === 'success' ? <CheckCircle2 size={14} className="text-[var(--success)] flex-shrink-0" /> :
                     b.status === 'failed'  ? <XCircle size={14} className="text-[var(--error)] flex-shrink-0" /> :
                     b.status === 'running' ? <Loader2 size={14} className="animate-spin text-[var(--info)] flex-shrink-0" /> :
                     <Clock size={14} className="text-[var(--text-muted)] flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--text-primary)] truncate">{b.prompt.slice(0, 50)}...</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {new Date(b.createdAt).toLocaleString()}
                        {b.durationMs && ` · ${(b.durationMs / 1000).toFixed(1)}s`}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: statusInfo.color, background: `${statusInfo.color}20` }}>
                      {statusInfo.zh}
                    </span>
                  </div>
                );
              })}
              {(!builds || builds.length === 0) && (
                <div className="text-xs text-[var(--text-muted)] text-center py-4">暂无构建记录</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
