export type Locale = 'zh' | 'en';

export interface NavItem {
  key: string;
  labelZh: string;
  labelEn: string;
  icon: string;
  path: string;
  badge?: string;
}

export const SUBSCRIPTION_TIERS = {
  free:       { name: 'Free',       price: 0,    buildsLimit: 2,    color: '#475569' },
  pro:        { name: 'Pro',        price: 99,   buildsLimit: 20,   color: '#818CF8' },
  team:       { name: 'Team',       price: 399,  buildsLimit: 60,   color: '#38BDF8' },
  enterprise: { name: 'Enterprise', price: 3999, buildsLimit: 9999, color: '#F59E0B' },
} as const;

export const AGENT_LAYER_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  infrastructure: { zh: '基础架构层', en: 'Infrastructure', color: '#F43F5E' },
  intelligence:   { zh: '智能能力层', en: 'Intelligence',   color: '#38BDF8' },
  audit:          { zh: '专业审计层', en: 'Audit',          color: '#F59E0B' },
};

export const BUILD_STATUS_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  pending:   { zh: '等待中', en: 'Pending',   color: '#94A3B8' },
  running:   { zh: '构建中', en: 'Running',   color: '#38BDF8' },
  success:   { zh: '成功',   en: 'Success',   color: '#34D399' },
  failed:    { zh: '失败',   en: 'Failed',    color: '#F43F5E' },
  cancelled: { zh: '已取消', en: 'Cancelled', color: '#F59E0B' },
};

export const SEVERITY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  critical: { zh: '严重', en: 'Critical', color: '#F43F5E' },
  high:     { zh: '高危', en: 'High',     color: '#FB923C' },
  medium:   { zh: '中危', en: 'Medium',   color: '#F59E0B' },
  low:      { zh: '低危', en: 'Low',      color: '#38BDF8' },
};
