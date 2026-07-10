import { create } from 'zustand';

// Fallback used before the Tabs bar has reported its measured height, so the
// scroll content reserves roughly the right space on first render.
const DEFAULT_TABS_HEIGHT = 44;

interface HomeChromeStore {
  isHidden: boolean;
  isScrolled: boolean;
  tabsHeight: number;
  setHidden: (hidden: boolean) => void;
  setScrolled: (scrolled: boolean) => void;
  setTabsHeight: (height: number) => void;
  reset: () => void;
}

export const useHomeChromeStore = create<HomeChromeStore>((set) => ({
  isHidden: false,
  isScrolled: false,
  tabsHeight: DEFAULT_TABS_HEIGHT,
  setHidden: (isHidden) =>
    set((state) => (state.isHidden === isHidden ? state : { isHidden })),
  setScrolled: (isScrolled) =>
    set((state) => (state.isScrolled === isScrolled ? state : { isScrolled })),
  setTabsHeight: (tabsHeight) =>
    set((state) =>
      Math.abs(state.tabsHeight - tabsHeight) < 0.5 ? state : { tabsHeight },
    ),
  // Keep the measured tabsHeight across tab switches — only the scroll-driven
  // chrome state resets.
  reset: () => set({ isHidden: false, isScrolled: false }),
}));
