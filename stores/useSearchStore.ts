import { create } from "zustand";
import type { Location as GeoLocation } from "@/http/list-api/types";

export type SearchLocationMode = "auto" | "city" | "all";

interface SearchStore {
  query: string;
  /** Debounced / committed query used by TanStack Query. */
  committedQuery: string;
  matchThreshold: number | null;
  selectedVibes: string[];
  locationMode: SearchLocationMode;
  manualLocation: GeoLocation | null;
  setQuery: (query: string) => void;
  commitQuery: (query?: string) => void;
  setMatchThreshold: (threshold: number | null) => void;
  setSelectedVibes: (vibes: string[]) => void;
  setLocationMode: (mode: SearchLocationMode) => void;
  setManualLocation: (location: GeoLocation | null) => void;
  clearFilters: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  query: "",
  committedQuery: "",
  matchThreshold: null as number | null,
  selectedVibes: [] as string[],
  locationMode: "all" as SearchLocationMode,
  manualLocation: null as GeoLocation | null,
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  ...INITIAL_STATE,
  setQuery: (query) => set({ query }),
  commitQuery: (query) => {
    const next = query ?? get().query;
    set({ query: next, committedQuery: next.trim() });
  },
  setMatchThreshold: (matchThreshold) => set({ matchThreshold }),
  setSelectedVibes: (selectedVibes) => set({ selectedVibes }),
  setLocationMode: (locationMode) => set({ locationMode }),
  setManualLocation: (manualLocation) => set({ manualLocation }),
  clearFilters: () =>
    set({
      matchThreshold: null,
      selectedVibes: [],
      locationMode: "all",
      manualLocation: null,
    }),
  reset: () => set(INITIAL_STATE),
}));
