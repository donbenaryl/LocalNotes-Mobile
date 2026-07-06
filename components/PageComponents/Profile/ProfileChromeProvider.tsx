import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

const TOP_OFFSET = 10;
/** Ignore sub-pixel scroll jitter from layout reflows. */
const SCROLL_DELTA_THRESHOLD = 0.5;
/** Snap chrome before the exact bottom edge to stop collapse ↔ scroll loops. */
const BOTTOM_SNAP_MAX = 80;
const BOTTOM_SNAP_RATIO = 0.15;

interface ProfileChromeContextValue {
  hideProgress: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  resetChrome: () => void;
}

const ProfileChromeContext = createContext<ProfileChromeContextValue | null>(null);

interface ProfileChromeProviderProps {
  children: ReactNode;
  hideRange?: number;
}

export function ProfileChromeProvider({
  children,
  hideRange = 100,
}: ProfileChromeProviderProps) {
  const hideProgress = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const maxScrollY = Math.max(
        0,
        event.contentSize.height - event.layoutMeasurement.height,
      );
      const deltaY = y - lastScrollY.value;

      // Content fits the viewport — collapsing chrome only resizes the list and
      // causes layout ↔ scroll feedback loops with no real scroll benefit.
      if (maxScrollY <= SCROLL_DELTA_THRESHOLD) {
        hideProgress.value = 0;
        lastScrollY.value = y;
        return;
      }

      if (Math.abs(deltaY) < SCROLL_DELTA_THRESHOLD) {
        lastScrollY.value = y;
        return;
      }

      if (y <= TOP_OFFSET) {
        hideProgress.value = 0;
      } else {
        const bottomSnapThreshold = Math.min(
          BOTTOM_SNAP_MAX,
          maxScrollY * BOTTOM_SNAP_RATIO,
        );

        if (y >= maxScrollY - bottomSnapThreshold) {
          // Lock chrome fully hidden near the bottom. Shrinking chrome grows the
          // scroll viewport, which lowers maxScrollY and can clamp contentOffset —
          // that delta then toggles hideProgress and makes the list "vibrate".
          hideProgress.value = 1;
        } else {
          hideProgress.value = Math.min(
            1,
            Math.max(0, hideProgress.value + deltaY / hideRange),
          );
        }
      }

      lastScrollY.value = y;
    },
  });

  const resetChrome = useCallback(() => {
    hideProgress.value = 0;
    lastScrollY.value = 0;
  }, [hideProgress, lastScrollY]);

  const value = useMemo(
    () => ({ hideProgress, scrollHandler, resetChrome }),
    [hideProgress, scrollHandler, resetChrome],
  );

  return (
    <ProfileChromeContext.Provider value={value}>
      {children}
    </ProfileChromeContext.Provider>
  );
}

export function useProfileChrome() {
  const context = useContext(ProfileChromeContext);
  if (!context) {
    throw new Error('useProfileChrome must be used within ProfileChromeProvider');
  }
  return context;
}
