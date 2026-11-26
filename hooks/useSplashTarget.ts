import { useCallback, useRef } from 'react';
import type { View } from 'react-native';
import {
  useSplashStore,
  type SplashTargetKey,
} from '@/stores/useSplashStore';

/**
 * Marks a wordmark as a landing spot for the splash animation. Attach `ref`
 * and `onLayout` to the wordmark wrapper (not siblings like `LnTile`) and
 * apply `hidden` as opacity 0 so the real text appears once the splash
 * wordmark has landed on it.
 */
export function useSplashTarget(key: SplashTargetKey) {
  const ref = useRef<View>(null);
  const hidden = useSplashStore((s) => s.phase === 'running');
  const registerRect = useSplashStore((s) => s.registerRect);

  const onLayout = useCallback(() => {
    if (useSplashStore.getState().phase !== 'running') return;
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerRect(key, { x, y, width, height });
        }
      });
    });
  }, [key, registerRect]);

  return { ref, onLayout, hidden };
}
