export type AccordionStatus = 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';
export type AccordionIconVariant = 'cyan' | 'green' | 'orange' | 'purple' | 'red';
export type AccordionBadgeSeverity = 'success' | 'info' | 'warning' | 'danger' | 'muted';
export type AccordionGap = 'none' | 'sm' | 'md' | 'lg';
export type AccordionPadding = 'none' | 'sm' | 'md' | 'lg';

export const GAP_MAP: Record<AccordionGap, string> = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
};

export const PADDING_MAP: Record<AccordionPadding, string> = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '28px',
};

export const STATUS_COLOR_MAP: Record<AccordionStatus, string> = {
  active: '#7ee787',
  upcoming: '#58a6ff',
  completed: '#6e7681',
  pending: '#f0883e',
  inactive: '#30363d',
};

export const ICON_VARIANT_MAP: Record<AccordionIconVariant, string> = {
  cyan: '#58a6ff',
  green: '#7ee787',
  orange: '#f0883e',
  purple: '#bc8cff',
  red: '#f85149',
};

export const BADGE_SEVERITY_MAP: Record<
  AccordionBadgeSeverity,
  { bg: string; text: string; border: string }
> = {
  success: { bg: '#7ee78726', text: '#7ee787', border: '#7ee78740' },
  info: { bg: '#58a6ff26', text: '#58a6ff', border: '#58a6ff40' },
  warning: { bg: '#f0883e26', text: '#f0883e', border: '#f0883e40' },
  danger: { bg: '#f8514926', text: '#f85149', border: '#f8514940' },
  muted: { bg: '#6e768126', text: '#6e7681', border: '#6e768140' },
};
