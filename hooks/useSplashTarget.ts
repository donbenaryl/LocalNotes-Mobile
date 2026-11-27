import { useCallback, useEffect, useRef } from 'react';
import type { View } from 'react-native';
import {
  useSplashStore,
  type SplashTargetKey,
} from '@/stores/useSplashStore';

/** Re-measure cadence while the splash runs (iOS pagers settle after first layout). */
const REMEASURE_INTERVAL_MS = 100;

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
export function useSplashTarget(key: SplashTargetKey) {
  const ref = useRef<View>(null);
  const hidden = useSplashStore((s) => s.phase === 'running');
  const registerRect = useSplashStore((s) => s.registerRect);

  const measure = useCallback(() => {
    if (useSplashStore.getState().phase !== 'running') return;
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        registerRect(key, { x, y, width, height });
      }
    });
  }, [key, registerRect]);

  const onLayout = useCallback(() => {
    requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    if (!hidden) return;
    const id = setInterval(measure, REMEASURE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hidden, measure]);

  return { ref, onLayout, hidden };
}
