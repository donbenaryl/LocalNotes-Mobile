import { create } from "zustand";

interface SearchChromeStore {
  filterHeaderBottom: number | null;
  setFilterHeaderBottom: (bottom: number | null) => void;
  activeResultCount: number;
  setActiveResultCount: (count: number) => void;
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
  reset: () => set({ filterHeaderBottom: null, activeResultCount: 0 }),
}));
