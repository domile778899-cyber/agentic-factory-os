import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Settings, Save, Eye, EyeOff, Loader2, CheckCircle2, CreditCard, Brain, Bell, Shield, Globe, Sliders } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, any> = {
  general: Globe, payment: CreditCard, pricing: Sliders,
  limits: Shield, ai: Brain, notification: Bell, oauth: Settings,
};
const CATEGORY_LABELS: Record<string, string> = {
  general: '基础设置', payment: '支付配置', pricing: '定价管理',
  limits: '限制配置', ai: 'AI 设置', notification: '通知配置', oauth: 'OAuth 配置',
};

export default function AdminSettingsPage() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading, refetch } = trpc.admin.settings.list.useQuery();
  const batchUpdate = trpc.admin.settings.batchUpdate.useMutation({
    onSuccess: () => { refetch(); toast.success('设置已保存！'); setSaving(false); },
    onError: (e) => { toast.error(e.message); setSaving(false); },
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      settings.forEach((s: any) => { vals[s.settingKey] = s.settingValue || ''; });
      setEditValues(vals);
    }
  }, [settings]);

  const categories = Array.from(new Set((settings || []).map((s: any) => s.category)));
  const filtered = (settings || []).filter((s: any) => s.category === activeCategory);

  const handleSave = () => {
    setSaving(true);
    const updates = Object.entries(editValues).map(([settingKey, settingValue]) => ({ settingKey, settingValue }));
    batchUpdate.mutate(updates);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-[var(--text-secondary)]" />
          <div>
            <h1 className="text-xl font-bold text-white">系统设置</h1>
            <p className="text-xs text-[var(--text-muted)]">配置平台参数、支付密钥、AI模型等</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="btn-brand gap-2 h-9">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          保存所有设置
        </Button>
      </div>

      <div className="flex gap-5">
        {/* Category Sidebar */}
        <div className="w-44 flex-shrink-0 space-y-1">
          {categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat] || Settings;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeCategory === cat ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-light)] border border-[var(--brand-primary)]/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white'}`}>
                <Icon size={13} />
                {CATEGORY_LABELS[cat] || cat}
              </button>
            );
          })}
        </div>

        {/* Settings Panel */}
        <div className="flex-1 space-y-4">
          {activeCategory === 'payment' && (
            <div className="glass-card p-4 border-[var(--warning)]/20 bg-[var(--warning)]/5">
              <div className="flex items-center gap-2 text-xs text-[var(--warning)]">
                <CreditCard size={13} />
                <span className="font-semibold">支付配置说明</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                在此处填写 Stripe、支付宝、微信支付的密钥。所有密钥均加密存储，不会在界面上明文显示。
                配置完成后，用户可通过订阅套餐页面完成付款。
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
          ) : (
            <div className="glass-card p-5 space-y-5">
              {filtered.map((setting: any, i: number) => {
                const isSecret = setting.settingType === 'secret';
                const isBool = setting.settingType === 'boolean';
                const isNumber = setting.settingType === 'number';
                const showSecret = showSecrets[setting.settingKey];
                const currentVal = editValues[setting.settingKey] ?? '';

                return (
                  <motion.div key={setting.settingKey} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="pb-5 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <label className="text-sm font-semibold text-[var(--text-primary)]">{setting.label}</label>
                          {isSecret && <span className="badge-warning text-[9px]">密钥</span>}
                          {isBool && <span className="badge-brand text-[9px]">布尔值</span>}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mb-2">{setting.description}</p>
                        {isBool ? (
                          <div className="flex gap-2">
                            {['true', 'false'].map(v => (
                              <button key={v} onClick={() => setEditValues(prev => ({ ...prev, [setting.settingKey]: v }))}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${currentVal === v ? (v === 'true' ? 'bg-[var(--success)] text-white border-[var(--success)]' : 'bg-[var(--error)] text-white border-[var(--error)]') : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'}`}>
                                {v === 'true' ? '✓ 开启' : '✗ 关闭'}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type={isSecret && !showSecret ? 'password' : isNumber ? 'number' : 'text'}
                              value={isSecret && currentVal === '***已配置***' ? '' : currentVal}
                              onChange={e => setEditValues(prev => ({ ...prev, [setting.settingKey]: e.target.value }))}
                              placeholder={isSecret ? '输入新密钥（留空则不修改）' : `请输入 ${setting.label}`}
                              className="input-dark pr-8"
                            />
                            {isSecret && (
                              <button onClick={() => setShowSecrets(prev => ({ ...prev, [setting.settingKey]: !showSecret }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {currentVal !== (settings?.find((s: any) => s.settingKey === setting.settingKey)?.settingValue || '') && (
                        <div className="flex-shrink-0 mt-7">
                          <CheckCircle2 size={16} className="text-[var(--warning)]" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
