import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Wrench, Search, Download, Star, Check, Loader2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'all', label: '全部', icon: '🌐' },
  { key: 'search', label: '搜索', icon: '🔍' },
  { key: 'code', label: '代码', icon: '💻' },
  { key: 'data', label: '数据', icon: '📊' },
  { key: 'creative', label: '创意', icon: '🎨' },
  { key: 'devtools', label: '开发工具', icon: '🛠️' },
  { key: 'notification', label: '通知', icon: '📱' },
  { key: 'system', label: '系统', icon: '⚙️' },
  { key: 'integration', label: '集成', icon: '🔌' },
  { key: 'document', label: '文档', icon: '📄' },
  { key: 'language', label: '语言', icon: '🌍' },
];

export default function SkillsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: skills, isLoading, refetch } = trpc.lobe.skills.list.useQuery();
  const installSkill = trpc.lobe.skills.install.useMutation({ onSuccess: () => { refetch(); toast.success('技能已安装！'); } });
  const uninstallSkill = trpc.lobe.skills.uninstall.useMutation({ onSuccess: () => { refetch(); toast.success('技能已卸载'); } });

  const filtered = (skills || []).filter((s: any) => {
    const matchSearch = !search || s.name.includes(search) || s.description?.includes(search);
    const matchCat = activeCategory === 'all' || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  const installedCount = (skills || []).filter((s: any) => s.installed).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/20 border border-[var(--warning)]/30 flex items-center justify-center">
            <Wrench size={20} className="text-[var(--warning)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Skills 技能市场</h1>
            <p className="text-sm text-[var(--text-secondary)]">为你的助理赋予超能力 · 已安装 {installedCount} 个</p>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索技能..." className="pl-8 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] w-52 h-9 text-sm" />
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat.key
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-default)]'
            }`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((skill: any, i: number) => (
            <motion.div
              key={skill.id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="feature-card group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-2xl flex-shrink-0 border border-[var(--border-subtle)]">
                  {skill.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{skill.name}</h3>
                    {skill.isBuiltin && <span className="badge-brand text-[9px] px-1.5">内置</span>}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{skill.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Download size={10} /> {skill.downloadCount >= 1000 ? `${(skill.downloadCount / 1000).toFixed(0)}k` : skill.downloadCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={10} className="text-[var(--warning)]" /> {skill.rating}
                  </span>
                  <span className="text-[var(--text-muted)]">{skill.author}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => skill.installed ? uninstallSkill.mutate({ skillId: skill.id }) : installSkill.mutate({ skillId: skill.id })}
                  disabled={installSkill.isPending || uninstallSkill.isPending}
                  className={`h-7 text-xs gap-1 px-3 ${skill.installed ? 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30 hover:bg-[var(--error)]/15 hover:text-[var(--error)] hover:border-[var(--error)]/30' : 'btn-brand'}`}
                >
                  {skill.installed ? <><Check size={11} /> 已安装</> : <><Download size={11} /> 安装</>}
                </Button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-[var(--text-muted)]">
              <Wrench size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">未找到匹配的技能</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
