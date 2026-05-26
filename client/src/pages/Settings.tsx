import { motion } from 'framer-motion';
import { Settings, Globe, User, Bell, Shield, Palette } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/_core/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t, locale, changeLocale } = useI18n();
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--text-muted)]/20 border border-[var(--border-default)] flex items-center justify-center">
          <Settings size={20} className="text-[var(--text-secondary)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">设置 / Settings</h1>
          <p className="text-sm text-[var(--text-secondary)]">账户、语言与偏好设置</p>
        </div>
      </motion.div>

      {/* Profile */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <User size={14} /> 账户信息
        </h3>
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="bg-[var(--brand-primary)] text-white text-xl">
              {user?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-base font-bold text-[var(--text-primary)]">{user?.name || '未登录'}</div>
            <div className="text-sm text-[var(--text-secondary)]">{user?.email || ''}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">角色: {user?.role === 'admin' ? '管理员' : '普通用户'}</div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Globe size={14} /> 语言 / Language
        </h3>
        <div className="flex gap-3">
          {(['zh', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => { changeLocale(l); toast.success(l === 'zh' ? '已切换为中文' : 'Switched to English'); }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                locale === l
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--brand-primary)]/50'
              }`}
            >
              {l === 'zh' ? '🇨🇳 中文' : '🇺🇸 English'}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Palette size={14} /> 主题 / Theme
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] border border-[var(--brand-primary)] flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[var(--brand-primary)]" />
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">深空晶体暗色主题</div>
            <div className="text-xs text-[var(--text-muted)]">#0B0B0F · #7C5CFC · 当前唯一主题</div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Shield size={14} /> 安全设置
        </h3>
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <span>API Key 加密存储</span>
            <span className="badge-success">AES-GCM-256</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <span>OAuth 认证</span>
            <span className="badge-success">已启用</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>沙盒代码执行隔离</span>
            <span className="badge-success">已启用</span>
          </div>
        </div>
      </div>
    </div>
  );
}
