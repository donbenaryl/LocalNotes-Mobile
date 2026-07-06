import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const SCROLL_THRESHOLD = 8;
const TOP_OFFSET = 10;

export function useScrollChromeHandler(setHidden: (hidden: boolean) => void) {
  const lastOffsetY = useRef(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const deltaY = offsetY - lastOffsetY.current;

      if (offsetY <= TOP_OFFSET) {
        setHidden(false);
      } else if (deltaY > SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (deltaY < -SCROLL_THRESHOLD) {
        setHidden(false);
      }

      lastOffsetY.current = offsetY;
    },
    [setHidden],
  );

  return { onScroll, scrollEventThrottle: 16 as const };
}
