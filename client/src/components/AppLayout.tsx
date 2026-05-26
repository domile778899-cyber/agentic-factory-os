import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { getLoginUrl } from '@/const';
import {
  Home, Factory, Bot, Box, Zap, Shield, Network,
  FolderOpen, DollarSign, CreditCard, Settings,
  ChevronLeft, ChevronRight, Globe, LogOut, User,
  Sparkles, Menu, X, Brain, Wrench, Plug, MessageSquare, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'nav_home',         path: '/',             icon: Home,          section: 'main' },
  { key: 'nav_factory',      path: '/factory',      icon: Factory,       section: 'main', badge: 'AI' },
  { key: 'nav_agents',       path: '/agents',       icon: Bot,           section: 'main' },
  { key: 'nav_workspace',    path: '/workspace',    icon: Box,           section: 'main', badge: '3D' },
  { key: 'nav_assistants',   path: '/assistants',   icon: MessageSquare, section: 'lobe', badge: 'NEW' },
  { key: 'nav_skills',       path: '/skills',       icon: Wrench,        section: 'lobe' },
  { key: 'nav_mcp',          path: '/mcp-servers',  icon: Plug,          section: 'lobe' },
  { key: 'nav_providers',    path: '/providers',    icon: Brain,         section: 'lobe', badge: '🆓' },
  { key: 'nav_evolution',    path: '/evolution',    icon: Sparkles,      section: 'ai' },
  { key: 'nav_maintenance',  path: '/maintenance',  icon: Shield,        section: 'ai' },
  { key: 'nav_moe',          path: '/moe',          icon: Network,       section: 'ai' },
  { key: 'nav_projects',     path: '/projects',     icon: FolderOpen,    section: 'biz' },
  { key: 'nav_earnings',     path: '/earnings',     icon: DollarSign,    section: 'biz' },
  { key: 'nav_subscription', path: '/subscription', icon: CreditCard,    section: 'biz' },
  { key: 'nav_settings',     path: '/settings',     icon: Settings,      section: 'system' },
  { key: 'nav_admin',         path: '/admin',        icon: ShieldCheck,   section: 'system', badge: 'ADMIN' },
] as const;

const SECTION_LABELS = {
  main:   { zh: '核心功能', en: 'Core' },
  lobe:   { zh: 'LobeHub 模块', en: 'LobeHub' },
  ai:     { zh: 'AI 引擎', en: 'AI Engine' },
  biz:    { zh: '商业化', en: 'Business' },
  system: { zh: '系统', en: 'System' },
};

interface AppLayoutProps { children: React.ReactNode; }

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, locale, changeLocale } = useI18n();

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b", "border-[var(--border-subtle)]")}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-dark)] flex items-center justify-center flex-shrink-0 glow-brand">
          <Factory size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="overflow-hidden">
              <div className="text-sm font-bold text-white leading-tight">Agentic Factory</div>
              <div className="text-xs text-[var(--text-muted)]">OS v1.0</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {(['main','lobe','ai','biz','system'] as const).map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section} className="mb-2">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  {SECTION_LABELS[section][locale]}
                </div>
              )}
              {items.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "sidebar-item",
                        isActive && "active",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 truncate text-sm">
                            {t(item.key as any)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && (item as any).badge && (
                        <span className="badge-brand text-[10px] px-1.5 py-0.5">{(item as any).badge}</span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom: locale + user */}
      <div className="border-t border-[var(--border-subtle)] p-2 space-y-1">
        {/* Locale toggle */}
        <button
          onClick={() => changeLocale(locale === 'zh' ? 'en' : 'zh')}
          className={cn("sidebar-item w-full", collapsed && "justify-center px-2")}
        >
          <Globe size={15} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">{locale === 'zh' ? 'English' : '中文'}</span>}
        </button>

        {/* User */}
        {isAuthenticated ? (
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", collapsed && "justify-center px-2")}>
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarFallback className="bg-[var(--brand-primary)] text-white text-xs">
                {user?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--text-primary)] truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">{user?.email || ''}</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                <LogOut size={14} />
              </button>
            )}
          </div>
        ) : (
          <a href={getLoginUrl()} className={cn("sidebar-item w-full", collapsed && "justify-center px-2")}>
            <User size={15} />
            {!collapsed && <span className="text-sm">登录 / Login</span>}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="hidden md:flex flex-col flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] relative overflow-hidden"
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand-light)] hover:border-[var(--brand-primary)] transition-all z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-0 top-0 bottom-0 w-[220px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <button onClick={() => setMobileOpen(true)} className="text-[var(--text-secondary)]">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-dark)] flex items-center justify-center">
              <Factory size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">Agentic Factory OS</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
