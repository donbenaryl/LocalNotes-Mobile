/** Single full-bleed welcome photo (redesign "Welcome — Good reviews. Wrong vibe."). */
export const WELCOME_BACKGROUND = require('../assets/welcome/backgrounds/rooftop.jpg');

/** Top-to-bottom ink gradient laid over the photo. */
export const WELCOME_GRADIENT_COLORS = [
  'rgba(26,23,20,0.62)',
  'rgba(26,23,20,0.10)',
  'rgba(26,23,20,0)',
  'rgba(26,23,20,0.70)',
  'rgba(26,23,20,0.92)',
  '#1A1714',
] as const;
export const WELCOME_GRADIENT_LOCATIONS = [0, 0.18, 0.3, 0.48, 0.62, 0.8] as const;

export const WELCOME_CREAM = '#F7F3EC';
export const WELCOME_INK = '#1A1714';

/** Still used by the force-update screen. */
export const WELCOME_GRADIENT_OVERLAY = require('../assets/welcome/gradient/overlay_gradient.png');
