import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { getLoginUrl } from '@/const';
import {
  Factory, Bot, Box, Zap, Shield, Network,
  ArrowRight, Sparkles, Code2, GitBranch, ChevronRight,
  DollarSign, Globe, Users, Brain, Wrench, Plug,
  CheckCircle2, Star, TrendingUp, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: Factory, title: 'AI 软件工厂', desc: '自然语言驱动，14个代理人协同构建完整软件', color: 'var(--brand-primary)', badge: 'Core' },
  { icon: Bot, title: '14职业代理人', desc: '安全、合规、后端、数据等全链路AI专家团队', color: 'var(--success)', badge: 'AI' },
  { icon: Box, title: '3D虚拟工作台', desc: 'Three.js 沉浸式3D场景，实时可视化代理人协作', color: 'var(--warning)', badge: '3D' },
  { icon: Sparkles, title: '自进化引擎', desc: 'LoRA微调+A/B测试，从每次使用中持续学习进化', color: 'var(--info)', badge: 'THMAI' },
  { icon: Shield, title: '自动维护自愈', desc: '自动扫描缺陷，生成修复PR，有监督自主自愈', color: 'var(--error)', badge: 'Auto' },
  { icon: Network, title: 'MoE智能路由', desc: '多模型混合专家架构，按任务类型智能调度', color: '#34D399', badge: 'MoE' },
  { icon: DollarSign, title: '赚钱社区', desc: '105+验证项目库、任务接单市场、AI收益计划', color: 'var(--warning)', badge: '💰' },
  { icon: Users, title: 'AI超级团队', desc: 'AGI时代终极形态，人类指挥官+AI Agent军团', color: '#A78BFA', badge: 'AGI' },
  { icon: Globe, title: '全球支付', desc: 'Stripe/支付宝/微信/PayPal/加密货币，托管付款', color: 'var(--success)', badge: '🌍' },
];

const PRICING = [
  { tier: 'Free', price: '¥0', period: '/月', builds: '2次/月', agents: '单智能体', color: '#475569', features: ['基础 AI 构建', '单智能体模式', '社区访问', '赚钱项目库浏览'] },
  { tier: 'Pro', price: '¥99', period: '/月', builds: '20次/月', agents: '14代理人单兵', color: '#818CF8', features: ['完整 AI 构建', '14个代理人单兵调用', '优先模型队列', '双层记忆系统', '任务接单市场'], hot: false },
  { tier: 'Team', price: '¥399', period: '/月', builds: '60次/月', agents: '5智能体协同', color: '#38BDF8', features: ['5智能体3D协同工作室', '团队共享代码库', '10GB专属知识库', 'GitHub自动化工厂', 'Telegram通知'], hot: true },
  { tier: 'Enterprise', price: '¥3,999', period: '/月', builds: '无限制', agents: '14智能体全量', color: '#F59E0B', features: ['14智能体全量3D编排', '私有化/VPC部署', 'SAML/OIDC SSO', '99.9% SLA保障', '专属客服团队'] },
];

const STATS = [
  { value: '105+', label: '赚钱项目', sub: 'Monetization Projects' },
  { value: '14', label: '职业代理人', sub: 'Professional Agents' },
  { value: '8', label: '全球语言', sub: 'Languages' },
  { value: '7', label: '支付通道', sub: 'Payment Methods' },
];

const TESTIMONIALS = [
  { name: '张工程师', role: '独立开发者', avatar: '👨‍💻', content: '用 AI 工厂3天就做出了一个完整的 SaaS 产品，以前需要2周！', income: '月入¥28,000' },
  { name: 'Sarah Chen', role: 'AI创业者', avatar: '👩‍💼', content: 'The 3D workspace is mind-blowing. Watching 14 AI agents collaborate in real-time is incredible!', income: '$15,000/mo' },
  { name: '李老板', role: '电商运营', avatar: '🛒', content: '用赚钱社区里的AI短视频矩阵方案，现在每月被动收入¥8000+', income: '月入¥8,500' },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* ═══ Hero Section ═══ */}
      <section className="relative pt-20 pb-16 px-4 text-center overflow-hidden particle-bg">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[var(--brand-primary)] opacity-[0.05] blur-[150px] pointer-events-none" />
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 max-w-5xl mx-auto">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-light)] text-sm font-medium mb-6">
            <Sparkles size={14} className="animate-pulse" />
            <span>AI 软件工程平台 · 深空晶体版 · 全球8语言</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-gradient">Agentic</span>
            <br />
            <span className="text-white">Factory OS</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed">
            融合 <span className="text-[var(--brand-light)] font-semibold">自进化 AI 底座</span>、
            <span className="text-[var(--success)] font-semibold">14职业代理人集群</span>、
            <span className="text-[var(--warning)] font-semibold">3D可视化工作台</span>、
            <span className="text-[var(--info)] font-semibold">105+赚钱项目社区</span>
            与全球支付矩阵于一体的下一代 AI 软件工程平台
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <Link href="/factory">
                <Button className="btn-brand h-12 px-8 text-base gap-2 glow-brand">
                  <Factory size={18} /> 进入 AI 工厂 <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-brand h-12 px-8 text-base gap-2 glow-brand">
                  <Sparkles size={18} /> 免费开始 <ArrowRight size={16} />
                </Button>
              </a>
            )}
            <Link href="/community">
              <Button variant="outline" className="h-12 px-8 text-base gap-2 border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10">
                <DollarSign size={18} /> 赚钱社区
              </Button>
            </Link>
            <Link href="/workspace">
              <Button variant="outline" className="h-12 px-8 text-base gap-2 border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-light)]">
                <Box size={18} /> 3D 工作台
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Terminal Preview */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 max-w-2xl mx-auto mt-14">
          <div className="glass-card p-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[var(--error)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
              <span className="ml-2 text-xs text-[var(--text-muted)] font-mono">agentic-factory.log</span>
            </div>
            <div className="terminal-log text-xs space-y-1">
              <div className="log-step">▶ [系统] 🚀 开始构建任务: "构建一个带用户认证的任务管理系统..."</div>
              <div className="log-info">✓ [安全架构师] 🔐 正在进行安全需求分析...</div>
              <div className="log-info">✓ [合规法务官] ⚖️ 检查合规性要求...</div>
              <div className="log-info">✓ [后端工程师] 🏗️ 生成 API 接口代码...</div>
              <div className="log-info">✓ [AI编程导师] 🧪 生成单元测试套件...</div>
              <div className="log-info">✓ [网络安全审计] 🛡️ 执行安全扫描...</div>
              <div className="log-success animate-pulse">✅ [系统] 构建完成！代码已生成并通过所有检查。推送到 GitHub...</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="py-10 px-4 border-y border-[var(--border-subtle)]">
        <div className="container">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="text-center">
                <div className="text-4xl font-extrabold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">{stat.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{stat.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Features Grid ═══ */}
      <section className="py-16 px-4">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">核心功能模块</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">三大开源项目深度融合，打造业界最完整的 AI 软件工程生态</p>
          </motion.div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={i} variants={itemVariants}>
                  <div className="feature-card group cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                        style={{ background: `${feat.color}20`, border: `1px solid ${feat.color}40` }}>
                        <Icon size={20} style={{ color: feat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{feat.title}</h3>
                          <span className="badge-brand text-[10px]">{feat.badge}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section className="py-16 px-4 border-t border-[var(--border-subtle)]">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">透明定价</h2>
            <p className="text-[var(--text-secondary)]">从免费开始，按需升级</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PRICING.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={`feature-card relative flex flex-col ${plan.hot ? 'ring-1 ring-[var(--success)]/40 border-[var(--success)]/30' : ''}`}>
                {plan.hot && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--success)] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">推荐</div>
                )}
                <div className="mb-4">
                  <div className="text-sm font-bold text-[var(--text-primary)] mb-1">{plan.tier}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold" style={{ color: plan.color }}>{plan.price}</span>
                    <span className="text-xs text-[var(--text-muted)]">{plan.period}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">{plan.builds} · {plan.agents}</div>
                </div>
                <div className="flex-1 space-y-2 mb-5">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                      <span className="text-[var(--text-secondary)]">{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={isAuthenticated ? '/subscription' : getLoginUrl()}>
                  <Button className="w-full h-9 text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${plan.color}cc, ${plan.color})` }}>
                    {plan.tier === 'Free' ? '免费开始' : '立即升级'}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="py-16 px-4 border-t border-[var(--border-subtle)]">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">用户真实反馈</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="feature-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{t.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{t.role}</div>
                  </div>
                  <div className="ml-auto text-xs font-bold text-[var(--success)]">{t.income}</div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">"{t.content}"</p>
                <div className="flex gap-0.5 mt-3">
                  {[1,2,3,4,5].map(s => <Star key={s} size={11} className="text-[var(--warning)] fill-[var(--warning)]" />)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Bottom ═══ */}
      <section className="py-16 px-4 border-t border-[var(--border-subtle)]">
        <div className="container">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="glass-card p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <Crown size={40} className="mx-auto mb-4 text-[var(--warning)]" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                准备好用 AI 构建下一个伟大的软件了吗？
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
                加入 Agentic Factory OS，让 14 个 AI 代理人为您的想法赋能，同时探索 105+ 种 AI 赚钱方式
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link href="/factory">
                    <Button className="btn-brand h-12 px-10 text-base gap-2">
                      <Factory size={18} /> 立即构建 <ChevronRight size={16} />
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button className="btn-brand h-12 px-10 text-base gap-2">
                      <Sparkles size={18} /> 免费开始 <ChevronRight size={16} />
                    </Button>
                  </a>
                )}
                <Link href="/community">
                  <Button variant="outline" className="h-12 px-8 text-base gap-2 border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10">
                    <DollarSign size={18} /> 探索赚钱社区
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-dark)] flex items-center justify-center">
              <Factory size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">Agentic Factory OS</span>
          </div>
          <div className="flex gap-6 text-xs text-[var(--text-muted)]">
            <Link href="/community"><span className="hover:text-[var(--brand-light)] transition-colors cursor-pointer">赚钱社区</span></Link>
            <Link href="/agent-team"><span className="hover:text-[var(--brand-light)] transition-colors cursor-pointer">AI超级团队</span></Link>
            <Link href="/payment"><span className="hover:text-[var(--brand-light)] transition-colors cursor-pointer">全球支付</span></Link>
            <Link href="/subscription"><span className="hover:text-[var(--brand-light)] transition-colors cursor-pointer">定价</span></Link>
          </div>
          <div className="text-xs text-[var(--text-muted)]">© 2026 Agentic Factory OS. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
