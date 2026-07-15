export const COLORS = {
  primary: '#F97316',       // orange
  primaryLight: '#FED7AA',  // orange-200
  primaryDark: '#EA580C',   // orange-600

  black: '#111827',         // gray-900
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

export const ICON_COLOR_LIGHT = '#191B1C';
export const ICON_COLOR_DARK = '#F3F4F6';

export type ColorKey = keyof typeof COLORS;
