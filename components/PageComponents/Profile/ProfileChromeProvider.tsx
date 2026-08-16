import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/** Matches HTML vitalbar: scrollTop > 300 toggles .show */
const DEFAULT_REVEAL_THRESHOLD = 300;
/** Hide below this to avoid flip-flopping around the show threshold. */
const DEFAULT_HIDE_THRESHOLD = 260;
/** Matches CSS transition: opacity/transform .22s ease */
const REVEAL_DURATION_MS = 220;

const REVEAL_TIMING = {
  duration: REVEAL_DURATION_MS,
  easing: Easing.ease,
};

interface ProfileChromeContextValue {
  hideProgress: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  resetChrome: () => void;
  setScrollYListener: (listener: ((y: number) => void) | null) => void;
}

const ProfileChromeContext = createContext<ProfileChromeContextValue | null>(null);

interface ProfileChromeProviderProps {
  children: ReactNode;
  /** Scroll Y above which sticky chrome reveals (binary, timed). */
  revealThreshold?: number;
  /** Scroll Y below which sticky chrome hides (hysteresis band). */
  hideThreshold?: number;
}

export function ProfileChromeProvider({
  children,
  revealThreshold = DEFAULT_REVEAL_THRESHOLD,
  hideThreshold = DEFAULT_HIDE_THRESHOLD,
}: ProfileChromeProviderProps) {
  const hideProgress = useSharedValue(0);
  const hideProgressTarget = useSharedValue(0);
  const revealThresholdSv = useSharedValue(revealThreshold);
  const hideThresholdSv = useSharedValue(hideThreshold);
  const scrollYListenerRef = useRef<((y: number) => void) | null>(null);

  const reportScrollY = useCallback((y: number) => {
    scrollYListenerRef.current?.(y);
  }, []);

  const setScrollYListener = useCallback(
    (listener: ((y: number) => void) | null) => {
      scrollYListenerRef.current = listener;
    },
    [],
  );

  useEffect(() => {
    revealThresholdSv.value = revealThreshold;
    hideThresholdSv.value = hideThreshold;
  }, [hideThreshold, hideThresholdSv, revealThreshold, revealThresholdSv]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      let nextTarget = hideProgressTarget.value;

      if (y > revealThresholdSv.value) {
        nextTarget = 1;
      } else if (y < hideThresholdSv.value) {
        nextTarget = 0;
      }

      if (hideProgressTarget.value !== nextTarget) {
        hideProgressTarget.value = nextTarget;
        hideProgress.value = withTiming(nextTarget, REVEAL_TIMING);
      }

      runOnJS(reportScrollY)(y);
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
      setScrollYListener,
    }),
    [hideProgress, scrollHandler, resetChrome, setScrollYListener],
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
