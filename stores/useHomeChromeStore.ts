import { create } from 'zustand';

interface HomeChromeStore {
  isHidden: boolean;
  setHidden: (hidden: boolean) => void;
  reset: () => void;
}

export const useHomeChromeStore = create<HomeChromeStore>((set) => ({
  isHidden: false,
  setHidden: (isHidden) =>
    set((state) => (state.isHidden === isHidden ? state : { isHidden })),
  reset: () => set({ isHidden: false }),
}));
