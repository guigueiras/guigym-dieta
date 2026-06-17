export const colors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',

  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryText: '#1E40AF',

  success: '#10B981',
  successLight: '#D1FAE5',
  successText: '#059669',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#92400E',

  macroProtein: '#10B981',
  macroCarb: '#3B82F6',
  macroFat: '#F59E0B',
  macroCal: '#0F172A',
} as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 } as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenH: 20,
  cardGap: 10,
  cardPadH: 18,
  cardPadV: 16,
} as const;
