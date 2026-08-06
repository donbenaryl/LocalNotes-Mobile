import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  Easing,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { TabItem } from '@/components/ui/Tabs';

/** Matches profile sticky: scrollTop > 300 toggles show */
const DEFAULT_REVEAL_THRESHOLD = 100;
/** Hide below this to avoid flip-flopping around the show threshold. */
const DEFAULT_HIDE_THRESHOLD = 160;
/** Matches CSS transition: opacity/transform .22s ease */
const REVEAL_DURATION_MS = 220;

const REVEAL_TIMING = {
  duration: REVEAL_DURATION_MS,
  easing: Easing.ease,
};

/**
 * Deliberately excludes the active tab: it changes on every tap, and putting it
 * here would invalidate the context for every mounted page's scroll view,
 * delaying the tab highlight. Screens pass it down as a prop instead.
 */
interface HomeTabsChromeContextValue {
  hideProgress: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  resetChrome: () => void;
  tabs: TabItem[];
}

const HomeTabsChromeContext = createContext<HomeTabsChromeContextValue | null>(
  null,
);

interface HomeTabsChromeProviderProps {
  children: ReactNode;
  tabs: TabItem[];
  revealThreshold?: number;
  hideThreshold?: number;
}

export function HomeTabsChromeProvider({
  children,
  tabs,
  revealThreshold = DEFAULT_REVEAL_THRESHOLD,
  hideThreshold = DEFAULT_HIDE_THRESHOLD,
}: HomeTabsChromeProviderProps) {
  const hideProgress = useSharedValue(0);
  const hideProgressTarget = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      let nextTarget = hideProgressTarget.value;

      if (y > revealThreshold) {
        nextTarget = 1;
      } else if (y < hideThreshold) {
        nextTarget = 0;
      }

      if (hideProgressTarget.value !== nextTarget) {
        hideProgressTarget.value = nextTarget;
        hideProgress.value = withTiming(nextTarget, REVEAL_TIMING);
      }
    },
  });

  const resetChrome = useCallback(() => {
    hideProgress.value = 0;
    hideProgressTarget.value = 0;
  }, [hideProgress, hideProgressTarget]);

  const value = useMemo(
    () => ({
      hideProgress,
      scrollHandler,
      resetChrome,
      tabs,
    }),
    [hideProgress, scrollHandler, resetChrome, tabs],
  );

  return (
    <HomeTabsChromeContext.Provider value={value}>
      {children}
    </HomeTabsChromeContext.Provider>
  );
}

export function useHomeTabsChrome() {
  const context = useContext(HomeTabsChromeContext);
  if (!context) {
    throw new Error(
      'useHomeTabsChrome must be used within HomeTabsChromeProvider',
    );
  }
  return context;
}
