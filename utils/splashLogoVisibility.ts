import { makeMutable } from 'react-native-reanimated';

/**
 * 0 while the splash owns the wordmark, 1 once the real logos may show.
 *
 * Lives in a shared value (not React/Zustand state) so the real logo can be
 * revealed on the UI thread the instant the splash word lands, even when the
 * JS thread is busy mounting the destination screen.
 */
export const splashLogoVisible = makeMutable(0);

/** Reveal the real logos (JS-thread callers). Worklets can set `.value = 1` directly. */
export function showSplashLogos(): void {
  splashLogoVisible.value = 1;
}
