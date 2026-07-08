import { create } from 'zustand';

interface HomeChromeStore {
  isHidden: boolean;
  isScrolled: boolean;
  setHidden: (hidden: boolean) => void;
  setScrolled: (scrolled: boolean) => void;
  reset: () => void;
}

export const useHomeChromeStore = create<HomeChromeStore>((set) => ({
  isHidden: false,
  isScrolled: false,
  setHidden: (isHidden) =>
    set((state) => (state.isHidden === isHidden ? state : { isHidden })),
  setScrolled: (isScrolled) =>
    set((state) => (state.isScrolled === isScrolled ? state : { isScrolled })),
  reset: () => set({ isHidden: false, isScrolled: false }),
}));
