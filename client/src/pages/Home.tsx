import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { getLoginUrl } from '@/const';
import {
  Factory, Bot, Box, Zap, Shield, Network,
  ArrowRight, Sparkles, Code2, GitBranch, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: Factory, title: 'AI 软件工厂', desc: '自然语言驱动，14个代理人协同构建完整软件', color: 'var(--brand-primary)', badge: 'Core' },
  { icon: Bot,     title: '14职业代理人', desc: '安全、合规、后端、数据等全链路AI专家团队', color: 'var(--success)', badge: 'AI' },
  { icon: Box,     title: '3D虚拟工作台', desc: 'Three.js 沉浸式3D场景，实时可视化代理人协作', color: 'var(--warning)', badge: '3D' },
  { icon: Sparkles,title: '自进化引擎', desc: 'LoRA微调+A/B测试，从每次使用中持续学习进化', color: 'var(--info)', badge: 'THMAI' },
  { icon: Shield,  title: '自动维护自愈', desc: '自动扫描缺陷，生成修复PR，有监督自主自愈', color: 'var(--error)', badge: 'Auto' },
  { icon: Network, title: 'MoE智能路由', desc: '多模型混合专家架构，按任务类型智能调度', color: '#34D399', badge: 'MoE' },
];

const STATS = [
  { value: '14', label: '职业代理人', sub: 'Professional Agents' },
  { value: '5+', label: '支持模型', sub: 'AI Models' },
  { value: '6', label: '变现模块', sub: 'Revenue Streams' },
  { value: '∞', label: '构建次数', sub: 'Enterprise Builds' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] particle-bg">
      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[var(--brand-primary)] opacity-[0.06] blur-[120px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-light)] text-sm font-medium mb-6">
            <Sparkles size={14} className="animate-pulse" />
            <span>AI 软件工程平台 · 深空晶体版</span>
          </motion.div>

          {/* Title */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-gradient">Agentic</span>
            <br />
            <span className="text-white">Factory OS</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            融合 <span className="text-[var(--brand-light)] font-semibold">自进化 AI 底座</span>、
            <span className="text-[var(--success)] font-semibold">14职业代理人集群</span>、
            <span className="text-[var(--warning)] font-semibold">3D可视化工作台</span>
            与商业变现矩阵于一体的下一代 AI 软件工程平台
          </motion.p>

          {/* CTA */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <Link href="/factory">
                <Button className="btn-brand h-12 px-8 text-base gap-2 glow-brand">
                  <Factory size={18} />
                  进入 AI 工厂
                  <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-brand h-12 px-8 text-base gap-2 glow-brand">
                  <Sparkles size={18} />
                  立即开始
                  <ArrowRight size={16} />
                </Button>
              </a>
            )}
            <Link href="/workspace">
              <Button variant="outline" className="h-12 px-8 text-base gap-2 border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-light)]">
                <Box size={18} />
                查看 3D 工作台
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated code snippet */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 max-w-2xl mx-auto mt-14"
        >
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
              <div className="log-success animate-pulse">✅ [系统] 构建完成！代码已生成并通过所有检查。</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-[var(--border-subtle)]">
        <div className="container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
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

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              核心功能模块
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              三大开源项目深度融合，打造业界最完整的 AI 软件工程生态
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={i} variants={itemVariants}>
                  <div className="feature-card group cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                        style={{ background: `${feat.color}20`, border: `1px solid ${feat.color}40` }}
                      >
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

      {/* CTA Bottom */}
      <section className="py-16 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-10 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <Code2 size={40} className="mx-auto mb-4 text-[var(--brand-light)]" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                准备好用 AI 构建下一个伟大的软件了吗？
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
                加入 Agentic Factory OS，让 14 个 AI 代理人为您的想法赋能
              </p>
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
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
