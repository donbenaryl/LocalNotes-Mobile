export const COLORS = {
  primary: '#1A1714', // brand / ink
  primaryLight: '#F3F4F6', // brand tint / gray-100
  primaryDark: '#000000',

  black: '#111827', // gray-900
  white: '#FFFFFF',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  success: '#22C55E',
  error: '#EF4444',
  warning: '#EAB308',
} as const;

/** Brand accent (light mode) — matches Tailwind `brand` / `ink`. */
export const BRAND = '#1A1714';
/** Brand accent on dark surfaces — matches gray-100. */
export const BRAND_ON_DARK = '#F7F3EC';
/** Soft brand fill — matches Tailwind `brand-tint`. */
export const BRAND_TINT = '#F3F4F6';
/** Deeper brand emphasis — matches Tailwind `brand-dark`. */
export const BRAND_DARK = '#000000';

export const ICON_COLOR_LIGHT = '#1A1714';
export const ICON_COLOR_DARK = '#F7F3EC';

export type ColorKey = keyof typeof COLORS;

export function brandColor(isDark: boolean): string {
  return isDark ? BRAND_ON_DARK : BRAND;
}
