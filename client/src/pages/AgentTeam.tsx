import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  Users, Shield, Scale, Server, CandlestickChart, Share2,
  DollarSign, Brain, Code, BarChart3, Eye, Accessibility,
  Search, Zap, ChevronRight, Play, CheckCircle2, Crown,
  GitBranch, Cpu, Network, Loader2, Star, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// 14 职业代理人 + 人类指挥官完整定义
const HUMAN_COMMANDERS = [
  {
    title: '首席 Prompt 架构师 (CPO)',
    icon: Crown,
    color: '#FFD700',
    description: '业务蓝图设计者、最高指令发布者',
    responsibilities: ['将商业需求转化为无歧义的结构化 Meta-Prompt', '设计系统演进路线，审批 AI 自动生成的 PRD', '定义 AI 军团的 KPI（Token 消耗上限、测试覆盖率）'],
    skills: ['高级提示词工程（Meta-Prompting、Few-Shot、CoT）', '上下文窗口管理（Claude/GPT-4o 限制）', '商业敏锐度与技术边界感'],
    badge: '人类指挥官',
  },
  {
    title: '全栈 AI 操盘手',
    icon: Network,
    color: '#38BDF8',
    description: '系统总架构师、Agent 协同调度官',
    responsibilities: ['搭建并维护 Multi-Agent 编排框架（LangGraph, CrewAI）', '当 AI 军团陷入死循环时进行人工干预（Human-in-the-Loop）', '配置自动化 CI/CD 流水线，将代码一键推送到云端'],
    skills: ['Agent 编排技术（LangGraph、CrewAI、AutoGen）', '全栈架构审阅能力（Go/Rust/TypeScript）', '云原生与基础设施（Docker、K8s、Terraform）'],
    badge: '人类指挥官',
  },
  {
    title: '首席安全与伦理风控官',
    icon: Shield,
    color: '#F43F5E',
    description: '系统最高合规官、终极拔线人',
    responsibilities: ['制定严苛的 AI 代码合规性校验规则', '管理和审计 AI 红队攻击报告', '掌握系统的终极上线审批权（Go-No-Go）'],
    skills: ['LLM 漏洞防御学（Prompt Injection、越狱攻击）', '安全合规知识库（OWASP Top 10 for LLM、GDPR）', '数据投毒与 AI 供应链攻击防御'],
    badge: '人类指挥官',
  },
];

const AI_AGENTS = [
  {
    key: 'requirement_parser',
    title: '需求解构 Agent',
    subtitle: 'Requirement Parser',
    icon: Search,
    color: '#818CF8',
    layer: 'pipeline',
    step: 1,
    description: '技术大拿。接收人类 CPO 的模糊想法，自动查阅互联网竞品，输出极其严谨的技术方案书',
    tools: ['联网检索（Web Search Tool）', 'UML 绘图工具（Mermaid/Graphviz）', '长文本生成（Markdown 技术规范）'],
    skills: ['竞品 API 实时抓取', '系统架构图自动绘制', '数据库 Schema 结构设计'],
    output: '技术方案书 + 数据库 Schema + 系统架构图',
  },
  {
    key: 'architecture_router',
    title: '架构路由 Agent',
    subtitle: 'Architecture Router',
    icon: GitBranch,
    color: '#38BDF8',
    layer: 'pipeline',
    step: 2,
    description: '技术选型专家。评估解构出来的需求，基于性能、成本、开发速度，自主决定底层技术栈',
    tools: ['决策矩阵分析', '代码脚手架生成器（Scaffolding Tool）', '技术栈评估引擎'],
    skills: ['高并发低延迟 → Go/Rust 分发', '高保真前端 → TypeScript/Next.js 分发', '自动初始化项目目录和环境依赖'],
    output: '技术栈决策 + 项目脚手架 + 任务分发计划',
  },
  {
    key: 'go_coder',
    title: 'Go 极限编码 Agent',
    subtitle: 'Go Infinite Coder',
    icon: Code,
    color: '#34D399',
    layer: 'coding',
    step: 3,
    description: '顶级 Go 疯狂码农。专注高并发、微服务、gRPC 接口，秒级生成千行无错 Go 代码',
    tools: ['文件系统操作（FileSystem API）', 'Go 微调代码大模型', '依赖包管理（go.mod）'],
    skills: ['高并发 Goroutine 设计', 'gRPC/REST API 生成', '微服务架构实现'],
    output: 'Go 后端服务代码 + API 接口 + 单元测试',
  },
  {
    key: 'ts_coder',
    title: 'TypeScript 极限编码 Agent',
    subtitle: 'TypeScript Infinite Coder',
    icon: Code,
    color: '#60A5FA',
    layer: 'coding',
    step: 3,
    description: '顶级 TypeScript 疯狂码农。专注 React/Next.js 前端、Node.js 后端、全栈应用',
    tools: ['文件系统操作（FileSystem API）', 'TypeScript 微调代码大模型', 'npm/pnpm 依赖管理'],
    skills: ['React/Next.js 组件生成', 'TypeScript 类型安全代码', 'tRPC/GraphQL API 设计'],
    output: 'TypeScript 前后端代码 + 组件库 + 类型定义',
  },
  {
    key: 'python_coder',
    title: 'Python 极限编码 Agent',
    subtitle: 'Python Infinite Coder',
    icon: Code,
    color: '#F59E0B',
    layer: 'coding',
    step: 3,
    description: '顶级 Python 疯狂码农。专注 AI/ML、数据分析、FastAPI 后端、自动化脚本',
    tools: ['文件系统操作（FileSystem API）', 'Python 微调代码大模型', 'pip/poetry 依赖管理'],
    skills: ['FastAPI/Django 后端开发', 'PyTorch/TensorFlow ML 代码', '数据分析（Pandas/NumPy）'],
    output: 'Python 服务代码 + ML 模型 + 数据处理脚本',
  },
  {
    key: 'rust_coder',
    title: 'Rust 极限编码 Agent',
    subtitle: 'Rust Infinite Coder',
    icon: Cpu,
    color: '#FB923C',
    layer: 'coding',
    step: 3,
    description: '顶级 Rust 疯狂码农。专注系统级编程、WebAssembly、高性能底层服务',
    tools: ['文件系统操作（FileSystem API）', 'Rust 微调代码大模型', 'Cargo 依赖管理'],
    skills: ['内存安全系统编程', 'WebAssembly 编译', '高性能并发服务'],
    output: 'Rust 系统代码 + WASM 模块 + 性能基准测试',
  },
  {
    key: 'self_healing',
    title: '自我纠错与编译 Agent',
    subtitle: 'Self-Healing Compiler',
    icon: Zap,
    color: '#F43F5E',
    layer: 'qa',
    step: 4,
    description: '严厉的编译器与 QA。在沙盒环境中运行代码，捕捉任何报错，强迫编码 Agent 进行自我反思',
    tools: ['沙盒执行环境（Secure Sandbox Run）', '执行命令行工具（CLI/Terminal Executor）', '反思循环算法（Self-Reflection Loop）'],
    skills: ['Docker 隔离沙盒运行', '自动运行 go build/npm run build/pytest', '错误堆栈 + 原代码反思 Prompt 生成'],
    output: '编译通过的代码 + 单元测试 100% 通过报告',
  },
  {
    key: 'security_auditor',
    title: '漏洞扫描与红队 Agent',
    subtitle: 'Autonomous Red-Teaming',
    icon: Eye,
    color: '#A78BFA',
    layer: 'security',
    step: 5,
    description: '顶级黑客、安全审判官。代码上线前的最后一关，用最流氓的手段去黑掉自己人的系统',
    tools: ['漏洞扫描工具（Snyk、SonarQube、Slither）', '动态渗透测试（DAST）', '自动化提示词注入/SQL注入/IDOR测试'],
    skills: ['OWASP Top 10 自动化检测', '智能合约安全审计', '流量爆破与越权漏洞测试'],
    output: '安全审计报告 + 漏洞列表 + 修复建议',
  },
  // Original 14 agents
  { key: 'security_architect', title: '安全架构师', subtitle: 'Security Architect', icon: Shield, color: '#F43F5E', layer: 'infrastructure', step: 0, description: 'OAuth 2.0 + PKCE、Token Vault加密存储，确保系统安全基础设施', tools: ['OAuth 2.1 协议实现', 'AES-GCM-256 加密', 'JWT/RS256 签名'], skills: ['身份认证体系设计', '密钥管理', '零信任架构'], output: '安全架构文档 + 认证系统代码' },
  { key: 'legal_compliance', title: '合规法务官', subtitle: 'Legal Compliance', icon: Scale, color: '#A78BFA', layer: 'infrastructure', step: 0, description: '隐私政策、用户协议、合规框架，确保平台合法合规运营', tools: ['《个保法》合规检查', 'GDPR 合规审查', '数据安全法框架'], skills: ['隐私政策起草', '合规风险评估', '法律文件生成'], output: '合规报告 + 法律文件 + 风险评估' },
  { key: 'backend_engineer', title: '后端工程师', subtitle: 'Backend Engineer', icon: Server, color: '#60A5FA', layer: 'infrastructure', step: 0, description: 'Express + Prisma + PostgreSQL + Docker，构建高性能后端服务', tools: ['FastAPI/Express 框架', 'PostgreSQL/MySQL', 'Docker 容器化'], skills: ['RESTful API 设计', '数据库优化', '微服务架构'], output: '后端 API 代码 + 数据库设计 + Docker 配置' },
  { key: 'data_analyst', title: '数据分析师', subtitle: 'Data Analyst', icon: BarChart3, color: '#34D399', layer: 'intelligence', step: 0, description: '数据分析、图表可视化、报告生成，将数据转化为商业洞察', tools: ['Pandas/NumPy 数据处理', 'Matplotlib/Plotly 可视化', 'Jupyter Notebook'], skills: ['统计分析', '数据可视化', '预测模型'], output: '数据分析报告 + 可视化图表 + 洞察建议' },
  { key: 'researcher', title: '研究员', subtitle: 'Researcher', icon: Search, color: '#818CF8', layer: 'audit', step: 0, description: '深度研究、竞品分析、文献综述，提供决策支持', tools: ['联网检索工具', '学术数据库接入', '报告生成器'], skills: ['竞品深度分析', '市场调研', '技术趋势预测'], output: '研究报告 + 竞品分析 + 市场洞察' },
  { key: 'accessibility', title: '无障碍合规', subtitle: 'Accessibility', icon: Accessibility, color: '#38BDF8', layer: 'audit', step: 0, description: 'WCAG 2.2 AA 合规检查，确保产品对所有用户可访问', tools: ['WCAG 2.2 检查工具', '屏幕阅读器测试', '色彩对比度分析'], skills: ['无障碍标准审查', 'ARIA 标签优化', '键盘导航测试'], output: '无障碍审计报告 + 修复建议' },
];

const WORKFLOW_STEPS = [
  { step: 1, label: '需求解构', icon: Search, color: '#818CF8' },
  { step: 2, label: '架构路由', icon: GitBranch, color: '#38BDF8' },
  { step: 3, label: '并行编码', icon: Code, color: '#34D399' },
  { step: 4, label: '自我纠错', icon: Zap, color: '#F43F5E' },
  { step: 5, label: '安全审计', icon: Eye, color: '#A78BFA' },
  { step: 6, label: '人类上线', icon: CheckCircle2, color: '#F59E0B' },
];

export default function AgentTeamPage() {
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'agents' | 'commanders'>('pipeline');
  const { isAuthenticated } = useAuth();

  const pipelineAgents = AI_AGENTS.filter(a => a.layer === 'pipeline' || a.layer === 'coding' || a.layer === 'qa' || a.layer === 'security');
  const infraAgents = AI_AGENTS.filter(a => a.layer === 'infrastructure');
  const intelligenceAgents = AI_AGENTS.filter(a => a.layer === 'intelligence' || a.layer === 'audit');

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <div className="relative px-6 py-8 particle-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/10 via-transparent to-[var(--success)]/10 pointer-events-none" />
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--success)] flex items-center justify-center shadow-lg">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">AI 超级编程团队</h1>
              <p className="text-sm text-[var(--text-secondary)]">AGI 时代终极形态 · 极少数人类领袖 + 硅基 AI Agent 军团</p>
            </div>
          </motion.div>

          {/* Workflow Steps */}
          <div className="flex items-center gap-1 flex-wrap">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold" style={{ background: `${step.color}20`, border: `1px solid ${step.color}40`, color: step.color }}>
                    <Icon size={11} /> {step.step}. {step.label}
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && <ChevronRight size={12} className="text-[var(--text-muted)]" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-[var(--border-subtle)]">
        {[
          { key: 'pipeline', label: 'AI 构建流水线', icon: Zap },
          { key: 'agents', label: '14 职业代理人', icon: Users },
          { key: 'commanders', label: '人类指挥官', icon: Crown },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white'}`}>
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {/* ═══ AI 构建流水线 ═══ */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="glass-card p-5 border-[var(--brand-primary)]/20">
              <h3 className="text-sm font-bold text-white mb-2">🤖 硅基 AI Agent 军团工作流</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">人类 CPO 输入需求 → AI 军团自动执行 → 人类一键上线。整个过程 AI 关在 Docker 沙盒里，人始终在 Loop 里。</p>
              <div className="space-y-3">
                {pipelineAgents.sort((a, b) => a.step - b.step).map((agent, i) => {
                  const Icon = agent.icon;
                  return (
                    <motion.div key={agent.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="feature-card cursor-pointer group" onClick={() => setSelectedAgent(agent)}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: agent.color }}>
                            {agent.step}
                          </div>
                          {i < pipelineAgents.length - 1 && <div className="w-0.5 h-4 bg-[var(--border-subtle)]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={15} style={{ color: agent.color }} />
                            <span className="text-sm font-bold text-[var(--text-primary)]">{agent.title}</span>
                            <span className="text-[9px] text-[var(--text-muted)] font-mono">{agent.subtitle}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mb-2">{agent.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {agent.tools.map(tool => (
                              <span key={tool} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{tool}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-[10px] text-[var(--text-muted)] mb-1">输出</div>
                          <div className="text-[10px] text-[var(--success)] max-w-[120px] text-right">{agent.output}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ 14 职业代理人 ═══ */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--error)] mb-3 flex items-center gap-2">
                <Shield size={14} /> 基础架构层
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {infraAgents.map((agent, i) => {
                  const Icon = agent.icon;
                  return (
                    <motion.div key={agent.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="feature-card cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40` }}>
                          <Icon size={18} style={{ color: agent.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">{agent.title}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">{agent.subtitle}</div>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{agent.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--info)] mb-3 flex items-center gap-2">
                <Brain size={14} /> 智能能力层 & 专业审计层
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {intelligenceAgents.map((agent, i) => {
                  const Icon = agent.icon;
                  return (
                    <motion.div key={agent.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="feature-card cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40` }}>
                          <Icon size={18} style={{ color: agent.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">{agent.title}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">{agent.subtitle}</div>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{agent.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ 人类指挥官 ═══ */}
        {activeTab === 'commanders' && (
          <div className="space-y-4">
            <div className="glass-card p-4 border-[var(--warning)]/20 bg-[var(--warning)]/5">
              <p className="text-xs text-[var(--text-secondary)]">
                💡 在 AGI 时代，团队仅需 <span className="text-[var(--warning)] font-bold">3-4 名人类</span>。他们不生产代码，只进行战略输入、架构审定和终极风控。
                AI 军团负责所有执行工作，但人始终在 Loop 里，掌握最终决策权。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {HUMAN_COMMANDERS.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="feature-card border-[var(--warning)]/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${cmd.color}20`, border: `1px solid ${cmd.color}40` }}>
                        <Icon size={22} style={{ color: cmd.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-white">{cmd.title}</div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${cmd.color}20`, color: cmd.color }}>
                          {cmd.badge}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">{cmd.description}</p>
                    <div className="space-y-2">
                      <div className="text-[10px] font-semibold text-[var(--text-muted)]">核心职责</div>
                      {cmd.responsibilities.map((r, ri) => (
                        <div key={ri} className="flex items-start gap-1.5 text-[10px] text-[var(--text-secondary)]">
                          <CheckCircle2 size={10} className="mt-0.5 flex-shrink-0" style={{ color: cmd.color }} />
                          {r}
                        </div>
                      ))}
                      <div className="text-[10px] font-semibold text-[var(--text-muted)] mt-3">必备技能</div>
                      {cmd.skills.map((s, si) => (
                        <div key={si} className="flex items-start gap-1.5 text-[10px] text-[var(--text-secondary)]">
                          <Star size={9} className="mt-0.5 flex-shrink-0" style={{ color: cmd.color }} />
                          {s}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedAgent(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-20 z-50 glass-card p-6 overflow-y-auto">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${selectedAgent.color}20`, border: `2px solid ${selectedAgent.color}40` }}>
                    <selectedAgent.icon size={26} style={{ color: selectedAgent.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{selectedAgent.title}</h2>
                    <div className="text-xs text-[var(--text-muted)] font-mono">{selectedAgent.subtitle}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="text-[var(--text-muted)] hover:text-white text-xl">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">📋 职责描述</h3>
                    <p className="text-sm text-[var(--text-primary)]">{selectedAgent.description}</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">🛠️ 工具箱</h3>
                    <div className="space-y-1.5">
                      {selectedAgent.tools.map((tool: string) => (
                        <div key={tool} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <CheckCircle2 size={11} style={{ color: selectedAgent.color }} />
                          {tool}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">⚡ 核心技能</h3>
                    <div className="space-y-1.5">
                      {selectedAgent.skills.map((skill: string) => (
                        <div key={skill} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <Star size={10} style={{ color: selectedAgent.color }} />
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-4 border-[var(--success)]/20">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">📤 输出产物</h3>
                    <p className="text-sm text-[var(--success)]">{selectedAgent.output}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
