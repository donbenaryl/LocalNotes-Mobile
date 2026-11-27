import { create } from "zustand";
import type { Href } from "expo-router";

export type SearchResultCountKind = "picks" | "lists" | "people";

interface SearchResultCounts {
  picks: number;
  lists: number;
  people: number;
}

interface SearchChromeStore {
  filterHeaderBottom: number | null;
  setFilterHeaderBottom: (bottom: number | null) => void;
  /** Used by businesses search; MainSearch prefers resultCounts. */
  activeResultCount: number;
  setActiveResultCount: (count: number) => void;
  resultCounts: SearchResultCounts;
  setResultCount: (kind: SearchResultCountKind, count: number) => void;
  /** Non-search screen to restore when leaving Search via back. */
  returnTo: Href | null;
  setReturnTo: (href: Href | null) => void;
  reset: () => void;
}

const EMPTY_COUNTS: SearchResultCounts = {
  picks: 0,
  lists: 0,
  people: 0,
};

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
  resultCounts: EMPTY_COUNTS,
  setResultCount: (kind, count) =>
    set((state) =>
      state.resultCounts[kind] === count
        ? state
        : { resultCounts: { ...state.resultCounts, [kind]: count } },
    ),
  returnTo: null,
  setReturnTo: (returnTo) => set({ returnTo }),
  reset: () =>
    set({
      filterHeaderBottom: null,
      activeResultCount: 0,
      resultCounts: EMPTY_COUNTS,
      returnTo: null,
    }),
}));
