import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const SHOW_THRESHOLD = 200;
const IDLE_HIDE_MS = 2500;

/** Anything that can jump to the top — ScrollView or FlatList. */
export interface ScrollToTopTarget {
  scrollTo?: (options: { y: number; animated?: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
}

export function useScrollToTopControl(
  scrollRef: RefObject<ScrollToTopTarget | null>,
) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  const onScrollY = useCallback(
    (y: number) => {
      if (y < SHOW_THRESHOLD) {
        setVisible(false);
        clearHideTimer();
        return;
      }

      setVisible(true);
      clearHideTimer();
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, IDLE_HIDE_MS);
    },
    [clearHideTimer],
  );

  const scrollToTop = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    if (typeof node.scrollToOffset === 'function') {
      node.scrollToOffset({ offset: 0, animated: true });
    } else {
      node.scrollTo?.({ y: 0, animated: true });
    }

    setVisible(false);
    clearHideTimer();
  }, [clearHideTimer, scrollRef]);

  return { visible, onScrollY, scrollToTop };
}
