import { create } from "zustand";
import type { Href } from "expo-router";

interface SearchChromeStore {
  filterHeaderBottom: number | null;
  setFilterHeaderBottom: (bottom: number | null) => void;
  activeResultCount: number;
  setActiveResultCount: (count: number) => void;
  /** Non-search screen to restore when leaving Search via back. */
  returnTo: Href | null;
  setReturnTo: (href: Href | null) => void;
  reset: () => void;
}

export const useSearchChromeStore = create<SearchChromeStore>((set) => ({
  filterHeaderBottom: null,
  setFilterHeaderBottom: (filterHeaderBottom) =>
    set((state) =>
      state.filterHeaderBottom === filterHeaderBottom
        ? state
        : { filterHeaderBottom },
    ),
  activeResultCount: 0,
  setActiveResultCount: (activeResultCount) =>
    set((state) =>
      state.activeResultCount === activeResultCount ? state : { activeResultCount },
    ),
  returnTo: null,
  setReturnTo: (returnTo) => set({ returnTo }),
  reset: () =>
    set({ filterHeaderBottom: null, activeResultCount: 0, returnTo: null }),
}));
