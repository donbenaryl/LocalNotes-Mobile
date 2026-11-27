import { Dimensions } from 'react-native';
import { create } from 'zustand';

export type SplashRect = { x: number; y: number; width: number; height: number };
export type SplashTargetKey = 'home' | 'welcome';
export type SplashTarget = SplashTargetKey | 'none';
export type SplashPhase = 'running' | 'revealing' | 'done';

interface SplashStore {
  /**
   * `running` — splash owns the wordmark (destination text hidden).
   * `revealing` — destination text visible under a fading splash overlay.
   * `done` — overlay unmounted.
   */
  phase: SplashPhase;
  /** True once the intro clock has finished (word held at center). */
  introDone: boolean;
  /** Where the wordmark should land. `null` while the route is still resolving. */
  target: SplashTarget | null;
  rects: Partial<Record<SplashTargetKey, SplashRect>>;
  setIntroDone: () => void;
  setTarget: (target: SplashTarget) => void;
  registerRect: (key: SplashTargetKey, rect: SplashRect) => void;
  beginReveal: () => void;
  finish: () => void;
}

export const useSplashStore = create<SplashStore>((set, get) => ({
  phase: 'running',
  introDone: false,
  target: null,
  rects: {},
  setIntroDone: () => set({ introDone: true }),
  setTarget: (target) => set({ target }),
  registerRect: (key, rect) => {
    if (get().phase !== 'running') return;
    // Ignore logos that live in off-screen pager pages.
    const { width } = Dimensions.get('window');
    if (rect.x < 0 || rect.x + rect.width > width + 1) return;
    const prev = get().rects[key];
    if (
      prev &&
      Math.abs(prev.x - rect.x) < 0.5 &&
      Math.abs(prev.y - rect.y) < 0.5 &&
      Math.abs(prev.width - rect.width) < 0.5 &&
      Math.abs(prev.height - rect.height) < 0.5
    ) {
      return;
    }
    set((s) => ({ rects: { ...s.rects, [key]: rect } }));
  },
  beginReveal: () => {
    if (get().phase !== 'running') return;
    set({ phase: 'revealing' });
  },
  finish: () => set({ phase: 'done' }),
}));
