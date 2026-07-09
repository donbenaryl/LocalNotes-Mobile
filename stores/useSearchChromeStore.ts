import { create } from "zustand";

interface SearchChromeStore {
  filterHeaderBottom: number | null;
  setFilterHeaderBottom: (bottom: number | null) => void;
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
  reset: () => set({ filterHeaderBottom: null }),
}));
