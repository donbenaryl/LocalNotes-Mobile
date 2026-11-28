import { useCallback, useEffect, useRef } from 'react';
import type { View } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { splashLogoVisible } from '@/utils/splashLogoVisibility';
import {
  useSplashStore,
  type SplashTargetKey,
} from '@/stores/useSplashStore';

/** Fast re-measure cadence right after mount (iOS pagers settle after first layout). */
const FAST_INTERVAL_MS = 50;
const FAST_PHASE_MS = 1000;
/** Slower cadence for the rest of the splash. */
const SLOW_INTERVAL_MS = 100;

interface UseSplashTargetOptions {
  /**
   * Only the logo that is really the landing spot should be enabled. Disabled
   * instances never hide themselves and never report a rect (e.g. headers of
   * other sections that are mounted off-screen in a pager).
   */
  enabled?: boolean;
}

/**
 * Marks a wordmark as a landing spot for the splash animation. Attach `ref`
 * and `onLayout` to the wordmark wrapper (not siblings like `LnTile`) and
 * apply `hidden` as opacity 0 so the real text appears once the splash
 * wordmark has landed on it.
 *
 * The rect is re-measured while the splash is running: on iOS the first
 * `onLayout` can fire before nested pagers / screen transitions have settled,
 * and `onLayout` does not fire again.
 */
export function useSplashTarget(
  key: SplashTargetKey,
  { enabled = true }: UseSplashTargetOptions = {},
) {
  const ref = useRef<View>(null);
  const running = useSplashStore((s) => s.phase === 'running');
  const hidden = enabled && running;
  const registerRect = useSplashStore((s) => s.registerRect);

  const measure = useCallback(() => {
    if (!enabled) return;
    if (useSplashStore.getState().phase !== 'running') return;
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        registerRect(key, { x, y, width, height });
      }
    });
  }, [enabled, key, registerRect]);

  const onLayout = useCallback(() => {
    requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    if (!hidden) return;
    const raf = requestAnimationFrame(measure);
    let slowId: ReturnType<typeof setInterval> | undefined;
    const fastId = setInterval(measure, FAST_INTERVAL_MS);
    const switchId = setTimeout(() => {
      clearInterval(fastId);
      slowId = setInterval(measure, SLOW_INTERVAL_MS);
    }, FAST_PHASE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(fastId);
      clearTimeout(switchId);
      if (slowId) clearInterval(slowId);
    };
  }, [hidden, measure]);

  // Opacity runs on the UI thread so the logo shows the moment the splash word
  // lands, independent of how busy the JS thread is.
  const style = useAnimatedStyle(() => ({
    opacity: enabled ? splashLogoVisible.value : 1,
  }));

  return { ref, onLayout, hidden, style };
}
