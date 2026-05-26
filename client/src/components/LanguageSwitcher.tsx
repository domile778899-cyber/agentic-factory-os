import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { LOCALE_NAMES, type Locale } from '@/lib/i18n';

export default function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { locale, changeLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const current = LOCALE_NAMES[locale];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white transition-all w-full"
      >
        <Globe size={14} className="flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{current.flag} {current.name}</span>
            <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-1 w-44 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {(Object.entries(LOCALE_NAMES) as [Locale, typeof LOCALE_NAMES[Locale]][]).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => { changeLocale(code); setOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-all hover:bg-[var(--bg-base)] ${locale === code ? 'text-[var(--brand-light)] bg-[var(--brand-primary)]/10' : 'text-[var(--text-secondary)]'}`}
                >
                  <span className="text-base">{info.flag}</span>
                  <span className="flex-1 text-left">{info.name}</span>
                  {locale === code && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
