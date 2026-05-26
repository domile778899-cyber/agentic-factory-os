import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  DollarSign, TrendingUp, Zap, Search, Filter, Star,
  ChevronRight, Loader2, Trophy, Users, Target, Brain,
  Gift, Clock, Tag, ExternalLink, Plus, Send, MessageSquare,
  BarChart3, Sparkles, Briefcase, BookOpen, ShoppingBag,
  Lightbulb, Code2, Palette, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

const CATEGORY_ICONS: Record<string, any> = {
  agent: Zap, content: BookOpen, design: Palette,
  tech: Code2, ecommerce: ShoppingBag, education: GraduationCap, innovative: Lightbulb,
};
const CATEGORY_COLORS: Record<string, string> = {
  agent: 'var(--brand-primary)', content: 'var(--success)', design: '#F472B6',
  tech: 'var(--info)', ecommerce: 'var(--warning)', education: '#34D399', innovative: '#FB923C',
};
const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: '简单', color: 'var(--success)' },
  medium: { label: '中等', color: 'var(--warning)' },
  hard: { label: '困难', color: 'var(--error)' },
  expert: { label: '专家', color: '#F472B6' },
};

const TABS = [
  { key: 'projects', label: '赚钱项目库', icon: DollarSign },
  { key: 'tasks', label: '任务接单市场', icon: Briefcase },
  { key: 'community', label: '社区分享', icon: MessageSquare },
  { key: 'leaderboard', label: '收益排行榜', icon: Trophy },
  { key: 'plan', label: 'AI收益计划', icon: Brain },
];

export default function MoneyCommunityPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [planForm, setPlanForm] = useState({ targetMonthlyIncome: 10000, skills: '', timeAvailable: '2-4小时/天', budget: '免费启动', experience: '初学者' });
  const [planResult, setPlanResult] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'share', income: 0 });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', category: 'agent', budget: 3000 });

  const { isAuthenticated } = useAuth();
  const { data: projectsData, isLoading: projectsLoading } = trpc.community.projects.list.useQuery({ search, category: activeCategory || undefined, difficulty: activeDifficulty || undefined });
  const { data: hotProjects } = trpc.community.projects.hot.useQuery();
  const { data: stats } = trpc.community.projects.stats.useQuery();
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = trpc.community.tasks.list.useQuery({});
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = trpc.community.posts.list.useQuery({});
  const { data: leaderboard } = trpc.community.leaderboard.useQuery();

  const createPost = trpc.community.posts.create.useMutation({ onSuccess: () => { refetchPosts(); setShowPostForm(false); toast.success('帖子已发布！'); } });
  const createTask = trpc.community.tasks.create.useMutation({ onSuccess: () => { refetchTasks(); setShowTaskForm(false); toast.success('任务已发布！'); } });
  const takeTask = trpc.community.tasks.take.useMutation({ onSuccess: () => { refetchTasks(); toast.success('接单成功！请联系发布者开始工作。'); } });
  const likePost = trpc.community.posts.like.useMutation({ onSuccess: () => refetchPosts() });
  const generatePlan = trpc.community.incomePlan.generate.useMutation({
    onSuccess: (data) => { setPlanResult(data.analysis); setPlanLoading(false); },
    onError: (e) => { toast.error(e.message); setPlanLoading(false); },
  });

  const handleGeneratePlan = () => {
    if (!isAuthenticated) return toast.error('请先登录');
    setPlanLoading(true);
    generatePlan.mutate({ ...planForm, skills: planForm.skills.split(/[,，\s]+/).filter(Boolean) });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hero Banner */}
      <div className="relative px-6 py-8 particle-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--warning)]/10 via-transparent to-[var(--brand-primary)]/10 pointer-events-none" />
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--warning)] to-[var(--brand-primary)] flex items-center justify-center shadow-lg">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">赚钱社区</h1>
              <p className="text-sm text-[var(--text-secondary)]">用 AI 帮你赚钱 · {stats?.total || 50}+ 个经过验证的变现项目</p>
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '赚钱项目', value: `${stats?.total || 50}+`, icon: DollarSign, color: 'var(--warning)' },
              { label: '免费启动', value: `${stats?.freeCount || 30}+`, icon: Gift, color: 'var(--success)' },
              { label: '最高月收入', value: stats?.maxIncome || '¥100000+', icon: TrendingUp, color: 'var(--brand-primary)' },
              { label: '项目分类', value: `${stats?.categories || 6}大类`, icon: Tag, color: 'var(--info)' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-3 flex items-center gap-3">
                  <Icon size={18} style={{ color: s.color }} />
                  <div>
                    <div className="text-base font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-[var(--border-subtle)] overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white'}`}>
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ═══ 赚钱项目库 ═══ */}
        {activeTab === 'projects' && (
          <div className="space-y-5">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索赚钱项目..." className="pl-8 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] h-9 text-sm" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[{ key: '', label: '全部' }, { key: 'agent', label: 'AI Agent' }, { key: 'content', label: '内容创作' }, { key: 'design', label: 'AI设计' }, { key: 'tech', label: '技术开发' }, { key: 'ecommerce', label: '电商营销' }, { key: 'education', label: '教育咨询' }, { key: 'innovative', label: '创新项目' }].map(cat => (
                  <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${activeCategory === cat.key ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-white'}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                {[{ key: '', label: '全部难度' }, { key: 'easy', label: '简单' }, { key: 'medium', label: '中等' }, { key: 'hard', label: '困难' }].map(d => (
                  <button key={d.key} onClick={() => setActiveDifficulty(d.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${activeDifficulty === d.key ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Grid */}
            {projectsLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(projectsData?.list || []).map((project: any, i: number) => {
                  const Icon = CATEGORY_ICONS[project.category] || DollarSign;
                  const color = CATEGORY_COLORS[project.category] || 'var(--brand-primary)';
                  const diff = DIFFICULTY_LABELS[project.difficulty] || DIFFICULTY_LABELS.medium;
                  return (
                    <motion.div key={project.number} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className="feature-card group cursor-pointer" onClick={() => setSelectedProject(project)}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-bold text-[var(--text-primary)] truncate">{project.title}</span>
                            {project.isHot && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--error)]/15 text-[var(--error)] font-bold">🔥 热门</span>}
                            {project.isFree && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] font-bold">🆓 免费</span>}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{project.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-[var(--bg-elevated)] rounded-lg p-2 text-center">
                          <div className="text-xs font-bold" style={{ color }}>{project.incomeRange}</div>
                          <div className="text-[9px] text-[var(--text-muted)]">预期收入</div>
                        </div>
                        <div className="bg-[var(--bg-elevated)] rounded-lg p-2 text-center">
                          <div className="text-xs font-bold text-[var(--text-primary)]">{project.timeToProfit}</div>
                          <div className="text-[9px] text-[var(--text-muted)]">盈利周期</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {(project.tags as string[] || []).slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{tag}</span>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: diff.color, background: `${diff.color}20` }}>{diff.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ 任务接单市场 ═══ */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><Briefcase size={16} className="text-[var(--warning)]" /> 任务接单市场</h2>
              {isAuthenticated && (
                <Button onClick={() => setShowTaskForm(true)} className="btn-brand gap-2 h-9 text-sm"><Plus size={14} /> 发布任务</Button>
              )}
            </div>
            {tasksLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
            ) : (
              <div className="space-y-4">
                {(tasks || []).map((task: any, i: number) => (
                  <motion.div key={task.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="feature-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">{task.title}</h3>
                          <span className="badge-brand text-[9px]">{task.category}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${task.status === 'open' ? 'badge-success' : 'text-[var(--warning)] bg-[var(--warning)]/10'}`}>
                            {task.status === 'open' ? '招募中' : '进行中'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(typeof task.requiredSkills === 'string' ? JSON.parse(task.requiredSkills) : task.requiredSkills || []).map((skill: string) => (
                            <span key={skill} className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-light)] border border-[var(--brand-primary)]/20">{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-extrabold text-[var(--success)]">¥{task.budget?.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mb-2">预算</div>
                        {task.status === 'open' && isAuthenticated && (
                          <Button size="sm" onClick={() => takeTask.mutate({ taskId: task.id })} disabled={takeTask.isPending} className="btn-brand h-7 text-xs gap-1 px-3">
                            {takeTask.isPending ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                            立即接单
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                      <span>发布者: {task.publisherName || '匿名用户'}</span>
                      {task.deadline && <span className="flex items-center gap-1"><Clock size={10} /> 截止: {new Date(task.deadline).toLocaleDateString('zh')}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ 社区分享 ═══ */}
        {activeTab === 'community' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-[var(--info)]" /> 社区分享</h2>
              {isAuthenticated && (
                <Button onClick={() => setShowPostForm(true)} className="btn-brand gap-2 h-9 text-sm"><Plus size={14} /> 分享经验</Button>
              )}
            </div>
            {postsLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
            ) : (
              <div className="space-y-3">
                {(posts?.list || []).map((post: any, i: number) => (
                  <motion.div key={post.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="feature-card">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {post.authorName?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{post.authorName || '匿名用户'}</span>
                          {post.income > 0 && <span className="text-[10px] font-bold text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full">💰 月入¥{post.income.toLocaleString()}</span>}
                          <span className="text-[10px] text-[var(--text-muted)]">{new Date(post.createdAt).toLocaleDateString('zh')}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{post.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-3">{post.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-subtle)]">
                      <button onClick={() => likePost.mutate({ postId: post.id })} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--brand-light)] transition-colors">
                        ❤️ {post.likeCount || 0}
                      </button>
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">💬 {post.commentCount || 0}</span>
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">👁️ {post.viewCount || 0}</span>
                    </div>
                  </motion.div>
                ))}
                {(!posts?.list || posts.list.length === 0) && (
                  <div className="text-center py-12">
                    <MessageSquare size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
                    <p className="text-sm text-[var(--text-secondary)] mb-3">还没有分享帖子，来第一个分享吧！</p>
                    {isAuthenticated && <Button onClick={() => setShowPostForm(true)} className="btn-brand gap-2"><Plus size={14} /> 分享我的经验</Button>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ 收益排行榜 ═══ */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Trophy size={16} className="text-[var(--warning)]" /> 收益排行榜</h2>
            <div className="space-y-3">
              {(leaderboard || []).map((user: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className={`feature-card flex items-center gap-4 ${i < 3 ? 'border-[var(--warning)]/30' : ''}`}>
                  <div className="text-2xl font-extrabold w-8 text-center" style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)' }}>
                    {user.badge}
                  </div>
                  <div className="text-2xl">{user.avatar}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[var(--text-primary)]">{user.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{user.project}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-[var(--success)]">¥{user.income.toLocaleString()}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">月收益</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="glass-card p-4 border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 text-center">
              <p className="text-xs text-[var(--text-secondary)]">🎯 使用 Agentic Factory OS 的 AI 工厂，让 AI 帮你实现收益目标</p>
              <Button className="btn-brand mt-3 gap-2 h-8 text-xs" onClick={() => setActiveTab('plan')}>
                <Brain size={13} /> 生成我的收益计划
              </Button>
            </div>
          </div>
        )}

        {/* ═══ AI收益计划生成器 ═══ */}
        {activeTab === 'plan' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/30 flex items-center justify-center">
                <Brain size={20} className="text-[var(--brand-light)]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">AI 个性化收益计划生成器</h2>
                <p className="text-xs text-[var(--text-secondary)]">告诉 AI 你的情况，获取专属赚钱路线图</p>
              </div>
            </div>

            <div className="glass-card p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">目标月收入（元）</label>
                  <Input type="number" value={planForm.targetMonthlyIncome} onChange={e => setPlanForm(f => ({ ...f, targetMonthlyIncome: Number(e.target.value) }))} className="input-dark" min={100} />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">每天可用时间</label>
                  <select value={planForm.timeAvailable} onChange={e => setPlanForm(f => ({ ...f, timeAvailable: e.target.value }))} className="input-dark">
                    <option>1小时以内</option>
                    <option>1-2小时/天</option>
                    <option>2-4小时/天</option>
                    <option>4-8小时/天</option>
                    <option>全职投入</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">启动资金</label>
                  <select value={planForm.budget} onChange={e => setPlanForm(f => ({ ...f, budget: e.target.value }))} className="input-dark">
                    <option>免费启动</option>
                    <option>¥100-500</option>
                    <option>¥500-2000</option>
                    <option>¥2000-10000</option>
                    <option>¥10000以上</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">经验水平</label>
                  <select value={planForm.experience} onChange={e => setPlanForm(f => ({ ...f, experience: e.target.value }))} className="input-dark">
                    <option>初学者（无技术背景）</option>
                    <option>有一定技术基础</option>
                    <option>有编程经验</option>
                    <option>全栈开发者</option>
                    <option>AI工程师</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">你的技能（用逗号分隔）</label>
                <Input value={planForm.skills} onChange={e => setPlanForm(f => ({ ...f, skills: e.target.value }))} placeholder="例如：写作, Python, 设计, 营销, 视频剪辑..." className="input-dark" />
              </div>
              <Button onClick={handleGeneratePlan} disabled={planLoading || !isAuthenticated} className="btn-brand w-full gap-2 h-10">
                {planLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {!isAuthenticated ? '请先登录' : planLoading ? 'AI 分析中...' : '生成我的专属收益计划'}
              </Button>
            </div>

            {planResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-[var(--warning)]" />
                  <h3 className="text-sm font-bold text-white">你的专属收益计划</h3>
                </div>
                <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  <Streamdown>{planResult}</Streamdown>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedProject(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-10 z-50 glass-card p-6 overflow-y-auto">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedProject.isHot ? '🔥' : '💡'}</div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{selectedProject.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-muted)]">{selectedProject.categoryLabel}</span>
                      {selectedProject.isFree && <span className="badge-success text-[10px]">🆓 免费启动</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-[var(--text-muted)] hover:text-white text-xl">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">📋 项目描述</h3>
                    <p className="text-sm text-[var(--text-primary)]">{selectedProject.description}</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">💰 变现模式</h3>
                    <p className="text-sm text-[var(--success)]">{selectedProject.earningModel}</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">🛠️ 核心工具</h3>
                    <p className="text-sm text-[var(--brand-light)]">{selectedProject.tools}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card p-4 text-center">
                      <div className="text-lg font-extrabold text-[var(--success)]">{selectedProject.incomeRange}</div>
                      <div className="text-xs text-[var(--text-muted)]">预期月收入</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <div className="text-lg font-extrabold text-[var(--brand-light)]">{selectedProject.timeToProfit}</div>
                      <div className="text-xs text-[var(--text-muted)]">盈利周期</div>
                    </div>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-3">🏷️ 标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProject.tags as string[] || []).map((tag: string) => (
                        <span key={tag} className="badge-brand text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <Button className="btn-brand w-full gap-2 h-10" onClick={() => { setSelectedProject(null); setActiveTab('plan'); }}>
                    <Brain size={16} /> 基于此项目生成收益计划
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Post Form Modal */}
      <AnimatePresence>
        {showPostForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowPostForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-20 md:w-full md:max-w-lg z-50 glass-card p-6">
              <h3 className="text-sm font-bold text-white mb-4">分享我的赚钱经验</h3>
              <div className="space-y-3">
                <Input value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} placeholder="标题（例如：我用AI客服外包月入2万的经历）" className="input-dark" />
                <Textarea value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} placeholder="分享你的经验、方法、踩坑记录..." rows={5} className="input-dark resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">月收益（元，可选）</label>
                    <Input type="number" value={postForm.income} onChange={e => setPostForm(f => ({ ...f, income: Number(e.target.value) }))} className="input-dark" min={0} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">分类</label>
                    <select value={postForm.category} onChange={e => setPostForm(f => ({ ...f, category: e.target.value }))} className="input-dark">
                      <option value="share">经验分享</option>
                      <option value="question">求助提问</option>
                      <option value="case">成功案例</option>
                      <option value="tool">工具推荐</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={() => setShowPostForm(false)} className="text-[var(--text-secondary)]">取消</Button>
                <Button size="sm" onClick={() => createPost.mutate(postForm)} disabled={!postForm.title || !postForm.content || createPost.isPending} className="btn-brand gap-1">
                  {createPost.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  发布
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Form Modal */}
      <AnimatePresence>
        {showTaskForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowTaskForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-20 md:w-full md:max-w-lg z-50 glass-card p-6">
              <h3 className="text-sm font-bold text-white mb-4">发布任务</h3>
              <div className="space-y-3">
                <Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="任务标题" className="input-dark" />
                <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="详细描述任务需求..." rows={4} className="input-dark resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">预算（元）</label>
                    <Input type="number" value={taskForm.budget} onChange={e => setTaskForm(f => ({ ...f, budget: Number(e.target.value) }))} className="input-dark" min={100} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] mb-1 block">分类</label>
                    <select value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))} className="input-dark">
                      <option value="agent">AI Agent开发</option>
                      <option value="content">内容创作</option>
                      <option value="design">设计</option>
                      <option value="tech">技术开发</option>
                      <option value="ecommerce">电商营销</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={() => setShowTaskForm(false)} className="text-[var(--text-secondary)]">取消</Button>
                <Button size="sm" onClick={() => createTask.mutate(taskForm)} disabled={!taskForm.title || !taskForm.description || createTask.isPending} className="btn-brand gap-1">
                  {createTask.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  发布
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
