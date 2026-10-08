export const colors = {
  // Backgrounds & Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceMuted: '#F8FAFC',

  // Primary Brand: Restrained water blue & clean teal
  primary: '#0284C7', // Sky-600
  primaryHover: '#0369A1', // Sky-700
  primaryLight: '#E0F2FE', // Sky-100
  primarySubtle: '#F0F9FF', // Sky-50
  
  teal: '#0D9488',
  tealLight: '#CCFBF1',
  tealSubtle: '#F0FDFA',

  // Water Quality Status Colors (Strict semantic adherence)
  safe: '#16A34A', // Green-600
  safeLight: '#DCFCE7', // Green-100
  safeText: '#15803D', // Green-700
  safeBorder: '#BBF7D0',

  caution: '#D97706', // Amber-600
  cautionLight: '#FEF3C7', // Amber-100
  cautionText: '#B45309', // Amber-700
  cautionBorder: '#FDE68A',

  unsafe: '#DC2626', // Red-600
  unsafeLight: '#FEE2E2', // Red-100
  unsafeText: '#B91C1C', // Red-700
  unsafeBorder: '#FECACA',

  unverified: '#64748B', // Slate-500
  unverifiedLight: '#F1F5F9', // Slate-100
  unverifiedText: '#475569',
  unverifiedBorder: '#E2E8F0',

  // Typography Neutrals
  textPrimary: '#0F172A', // Slate-900
  textSecondary: '#475569', // Slate-600
  textMuted: '#94A3B8', // Slate-400
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0', // Slate-200
  borderDark: '#CBD5E1', // Slate-300
  borderLight: '#F1F5F9',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: colors.textMuted,
  },
  tag: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  metricLarge: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    color: colors.textPrimary,
  },
};

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  none: {},
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
};
