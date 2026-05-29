import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/hooks/useI18n';
import {
  Factory, Send, Loader2, CheckCircle2, XCircle,
  Clock, FolderOpen, Zap, Bot, Plus, Github, Bell,
  ChevronDown, Settings, ExternalLink, Gift, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BUILD_STATUS_LABELS } from '@shared/types';
import AgentWorkspace3D, { AGENT_PROFILES } from '@/components/AgentWorkspace3D';

const EXAMPLE_PROMPTS = [
  '构建一个带用户认证的任务管理系统，支持团队协作和实时通知',
  '开发一个 AI 驱动的电商推荐引擎，集成支付宝和微信支付',
  '创建一个加密货币量化交易平台，支持 OKX 和 Binance API',
  '构建一个多租户 SaaS 后台管理系统，包含权限管理和数据分析',
];

const FREE_MODELS = [
  { key: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'deepseek', badge: '🆓' },
  { key: 'deepseek-reasoner', label: 'DeepSeek R1', provider: 'deepseek', badge: '🆓' },
  { key: 'qwen-plus', label: 'Qwen Plus', provider: 'qwen', badge: '🆓' },
  { key: 'gemini-2.0-flash', label: 'Gemini Flash', provider: 'gemini', badge: '🆓' },
  { key: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', provider: 'groq', badge: '🆓' },
  { key: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek V3 (SiliconFlow)', provider: 'siliconflow', badge: '🆓' },
];

// Map build log agent names to agent keys
const AGENT_NAME_MAP: Record<string, string> = {
  '安全架构师': 'security_architect',
  '合规法务官': 'legal_compliance',
  '后端工程师': 'backend_engineer',
  'AI编程导师': 'ai_mentor',
  '数据分析师': 'data_analyst',
  '网络安全审计': 'cyber_auditor',
};

export default function FactoryPage() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeBuildId, setActiveBuildId] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubOrg, setGithubOrg] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [lastGithubRepo, setLastGithubRepo] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [agentMessages, setAgentMessages] = useState<Record<string, string>>({});
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: builds, refetch: refetchBuilds } = trpc.factory.builds.useQuery(
    { projectId: selectedProject! }, { enabled: !!selectedProject }
  );
  const { data: logs, refetch: refetchLogs } = trpc.factory.buildLogs.useQuery(
    { buildId: activeBuildId! },
    { enabled: !!activeBuildId, refetchInterval: polling ? 1000 : false }
  );

  const startBuild = trpc.factory.startBuild.useMutation({
    onSuccess: (data) => { setActiveBuildId(data.buildId); setPolling(true); toast.success('构建任务已启动！'); },
    onError: (e) => toast.error(e.message),
  });
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (data) => { toast.success('项目已创建'); setSelectedProject((data as any).insertId || 1); },
  });
  const createGithubRepo = trpc.lobe.github.createRepo.useMutation({
    onSuccess: (data) => {
      setLastGithubRepo(data.repoUrl);
      toast.success(`GitHub 仓库已创建：${data.repoName}`);
      if (telegramToken && telegramChatId) {
        sendTelegram.mutate({ botToken: telegramToken, chatId: telegramChatId, message: `🎉 *AI 软件制造局* 构建完成！\n\n📦 仓库：[${data.repoName}](${data.repoUrl})\n\n🤖 由 Agentic Factory OS 自动生成` });
      }
    },
    onError: (e) => toast.error(`GitHub 推送失败: ${e.message}`),
  });
  const sendTelegram = trpc.lobe.telegram.send.useMutation({ onSuccess: () => toast.success('Telegram 通知已发送！') });

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // Update active agents from logs
  useEffect(() => {
    if (!logs || !polling) return;
    const newActive: string[] = [];
    const newMessages: Record<string, string> = {};
    const recentLogs = logs.slice(-8);
    recentLogs.forEach(log => {
      if (log.agentName && AGENT_NAME_MAP[log.agentName]) {
        const key = AGENT_NAME_MAP[log.agentName];
        newActive.push(key);
        newMessages[key] = log.message.replace(/[\u2705\u274C\u2699\uFE0F]/g, '').trim().slice(0, 40);
      }
    });
    setActiveAgents(Array.from(new Set(newActive)));
    setAgentMessages(newMessages);

    const last = logs[logs.length - 1];
    if (last && (last.message.includes('构建完成') || last.message.includes('构建失败'))) {
      setPolling(false);
      refetchBuilds();
      setTimeout(() => { setActiveAgents([]); setAgentMessages({}); }, 3000);
      if (last.message.includes('构建完成') && githubToken && githubOrg) {
        createGithubRepo.mutate({
          repoName: `ai-factory-${Date.now()}`,
          description: prompt.slice(0, 100),
          files: {
            'README.md': `# AI Generated Project\n\n**Prompt:** ${prompt}\n\n**Generated by:** Agentic Factory OS\n\n**Model:** ${selectedModel}`,
            'main.py': `# Auto-generated by Agentic Factory OS\n# Prompt: ${prompt}\n\nprint("Hello from AI Factory!")\n`,
            '.gitignore': 'node_modules/\n.env\n__pycache__/\n*.pyc\n',
          },
          githubToken,
          org: githubOrg || undefined,
        });
      }
    }
  }, [logs, polling]);

  const handleBuild = async () => {
    if (!prompt.trim()) return toast.error('请输入构建需求');
    let projId = selectedProject;
    if (!projId) {
      const r = await createProject.mutateAsync({ name: `项目-${Date.now()}`, description: prompt.slice(0, 100) });
      projId = (r as any).insertId || 1;
      setSelectedProject(projId);
    }
    if (telegramToken && telegramChatId) {
      sendTelegram.mutate({ botToken: telegramToken, chatId: telegramChatId, message: `🚀 *AI 软件制造局启动*\n\n📝 需求：${prompt.slice(0, 100)}...\n\n🤖 模型：${selectedModel}` });
    }
    await startBuild.mutateAsync({ projectId: projId!, prompt });
  };

  const getLevelClass = (level: string) => ({ info: 'log-info', warn: 'log-warn', error: 'log-error', step: 'log-step', success: 'log-success' }[level] || 'log-default');

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* ═══ 3D 工作台（顶部全宽） ═══ */}
      <div className="px-6 pt-5">
        <AgentWorkspace3D
          activeAgents={activeAgents}
          agentMessages={agentMessages}
          isBuilding={polling}
          height={320}
          elevenlabsApiKey={localStorage.getItem('elevenlabs_api_key') || ''}
        />
      </div>

      {/* ═══ 主内容区 ═══ */}
      <div className="flex-1 p-6 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Input Panel */}
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory size={18} className="text-[var(--brand-light)]" />
              <span className="text-base font-bold text-white">{t('factory_title')}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20">
              <Gift size={11} className="text-[var(--success)]" />
              <span className="text-[10px] text-[var(--success)] font-medium">6 个免费模型</span>
            </div>
          </div>

          {/* Model Selector */}
          <div className="glass-card p-3">
            <div className="text-[10px] font-medium text-[var(--text-muted)] mb-2 flex items-center gap-1">
              <Brain size={11} /> 选择 AI 模型
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {FREE_MODELS.map(m => (
                <button key={m.key} onClick={() => setSelectedModel(m.key)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-all ${selectedModel === m.key ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-default)]'}`}>
                  <span>{m.badge}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Selector */}
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1"><FolderOpen size={11} /> 选择项目</span>
              <Button size="sm" variant="ghost" className="text-[var(--brand-light)] h-5 text-[10px] gap-1 px-1.5"
                onClick={() => createProject.mutate({ name: `新项目-${Date.now()}` })}>
                <Plus size={9} /> 新建
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(projects || []).map(p => (
                <button key={p.id} onClick={() => setSelectedProject(p.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${selectedProject === p.id ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-default)]'}`}>
                  {p.name}
                </button>
              ))}
              {(!projects || projects.length === 0) && <span className="text-[10px] text-[var(--text-muted)]">将自动创建项目</span>}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="glass-card p-4 flex flex-col gap-3">
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={t('factory_input_placeholder')}
              className="min-h-[100px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] resize-none text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleBuild(); }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)]">{prompt.length}/5000 · Ctrl+Enter</span>
              <Button onClick={handleBuild} disabled={startBuild.isPending || !prompt.trim()} className="btn-brand gap-2 h-9 px-5">
                {startBuild.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {startBuild.isPending ? t('factory_building') : t('factory_start_build')}
              </Button>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="glass-card p-3">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full text-[10px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
              <span className="flex items-center gap-1.5"><Settings size={11} /> GitHub 自动化 + Telegram 通知</span>
              <ChevronDown size={11} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-3 space-y-2">
                    <div className="text-[10px] text-[var(--success)] flex items-center gap-1 mb-1"><Github size={10} /> 构建完成后自动推送到 GitHub</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} placeholder="GitHub Token (ghp_...)" className="input-dark text-[10px] h-8" />
                      <Input value={githubOrg} onChange={e => setGithubOrg(e.target.value)} placeholder="组织名 (可选)" className="input-dark text-[10px] h-8" />
                    </div>
                    <div className="text-[10px] text-[var(--info)] flex items-center gap-1 mt-1 mb-1"><Bell size={10} /> Telegram 通知</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="password" value={telegramToken} onChange={e => setTelegramToken(e.target.value)} placeholder="Bot Token" className="input-dark text-[10px] h-8" />
                      <Input value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="Chat ID" className="input-dark text-[10px] h-8" />
                    </div>
                    {lastGithubRepo && (
                      <a href={lastGithubRepo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-[var(--success)] hover:underline">
                        <ExternalLink size={10} /> 查看最新仓库
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Example Prompts */}
          <div className="glass-card p-3">
            <div className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1"><Zap size={10} /> 示例需求</div>
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => setPrompt(p)} className="w-full text-left text-[10px] text-[var(--text-secondary)] hover:text-[var(--brand-light)] py-1 px-1.5 rounded hover:bg-[var(--brand-primary)]/10 transition-all truncate">
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Build Log + History */}
        <div className="flex flex-col gap-4">
          {/* Build Log */}
          <div className="glass-card p-4 flex flex-col" style={{ minHeight: 280 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                <Bot size={14} /> {t('factory_build_log')}
              </span>
              {polling && <span className="flex items-center gap-1 text-xs text-[var(--success)]"><Loader2 size={11} className="animate-spin" /> 构建中...</span>}
              {createGithubRepo.isPending && <span className="flex items-center gap-1 text-xs text-[var(--info)]"><Github size={11} /> 推送 GitHub...</span>}
            </div>
            <div className="terminal-log flex-1 overflow-y-auto" style={{ maxHeight: 240 }}>
              <AnimatePresence initial={false}>
                {(logs || []).map((log, i) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`mb-0.5 ${getLevelClass(log.level)}`}>
                    <span className="text-[var(--text-muted)] mr-2">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
              {(!logs || logs.length === 0) && <div className="text-[var(--text-muted)] text-center py-6 text-xs">等待构建任务启动...</div>}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Active Agents */}
          {activeAgents.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3">
              <div className="text-[10px] font-medium text-[var(--text-muted)] mb-2 flex items-center gap-1">
                <Bot size={10} className="text-[var(--brand-light)]" /> 正在工作的代理人
              </div>
              <div className="flex flex-wrap gap-2">
                {activeAgents.map(key => {
                  const profile = AGENT_PROFILES.find(a => a.key === key);
                  if (!profile) return null;
                  return (
                    <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium animate-pulse"
                      style={{ background: `#${profile.color.toString(16).padStart(6, '0')}20`, border: `1px solid #${profile.color.toString(16).padStart(6, '0')}40`, color: '#F1F5F9' }}>
                      <span>{profile.icon}</span>
                      <span>{profile.name}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Build History */}
          <div className="glass-card p-4">
            <div className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <Clock size={14} /> 构建历史
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(builds || []).map(b => {
                const statusInfo = BUILD_STATUS_LABELS[b.status] || BUILD_STATUS_LABELS.pending;
                return (
                  <div key={b.id} onClick={() => setActiveBuildId(b.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-[var(--bg-elevated)] ${activeBuildId === b.id ? 'bg-[var(--bg-elevated)] border border-[var(--border-hover)]' : ''}`}>
                    {b.status === 'success' ? <CheckCircle2 size={13} className="text-[var(--success)] flex-shrink-0" /> :
                     b.status === 'failed' ? <XCircle size={13} className="text-[var(--error)] flex-shrink-0" /> :
                     b.status === 'running' ? <Loader2 size={13} className="animate-spin text-[var(--info)] flex-shrink-0" /> :
                     <Clock size={13} className="text-[var(--text-muted)] flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--text-primary)] truncate">{b.prompt.slice(0, 45)}...</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{new Date(b.createdAt).toLocaleString()}{b.durationMs && ` · ${(b.durationMs / 1000).toFixed(1)}s`}</div>
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: statusInfo.color, background: `${statusInfo.color}20` }}>{statusInfo.zh}</span>
                  </div>
                );
              })}
              {(!builds || builds.length === 0) && <div className="text-xs text-[var(--text-muted)] text-center py-3">暂无构建记录</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
