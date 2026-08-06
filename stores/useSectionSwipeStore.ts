import { create } from "zustand";

/**
 * When false, the parent Material Top Tabs pager ignores horizontal swipes
 * so an inner SectionPager can own mid-section sub-tab paging.
 */
interface SectionSwipeStore {
  swipeEnabled: boolean;
  setSwipeEnabled: (enabled: boolean) => void;
}

export const useSectionSwipeStore = create<SectionSwipeStore>((set) => ({
  swipeEnabled: true,
  setSwipeEnabled: (swipeEnabled) =>
    set((state) =>
      state.swipeEnabled === swipeEnabled ? state : { swipeEnabled },
    ),
}));
