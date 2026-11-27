import { create } from "zustand";
import type { Location as GeoLocation } from "@/http/list-api/types";
import type { MatchPriorities } from "@/components/ui/MatchThreshhold";

export type SearchLocationMode = "auto" | "city" | "all";
export type SearchSort = "best" | "nearest" | "newest";

interface SearchStore {
  query: string;
  /** Debounced / committed query used by TanStack Query. */
  committedQuery: string;
  matchThreshold: number | null;
  matchPriorities: MatchPriorities;
  selectedVibes: string[];
  distanceMiles: number | null;
  selectedCategories: string[];
  followingOnly: boolean;
  sort: SearchSort;
  locationMode: SearchLocationMode;
  manualLocation: GeoLocation | null;
  /** True after the one-time home/device/"all" default has been applied. */
  hasAppliedDefaultLocation: boolean;
  setQuery: (query: string) => void;
  commitQuery: (query?: string) => void;
  setMatchThreshold: (threshold: number | null) => void;
  setMatchPriorities: (priorities: MatchPriorities) => void;
  setSelectedVibes: (vibes: string[]) => void;
  setDistanceMiles: (miles: number | null) => void;
  setSelectedCategories: (categories: string[]) => void;
  setFollowingOnly: (value: boolean) => void;
  setSort: (sort: SearchSort) => void;
  setLocationMode: (mode: SearchLocationMode) => void;
  setManualLocation: (location: GeoLocation | null) => void;
  setHasAppliedDefaultLocation: (value: boolean) => void;
  clearFilters: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  query: "",
  committedQuery: "",
  matchThreshold: null as number | null,
  matchPriorities: {} as MatchPriorities,
  selectedVibes: [] as string[],
  distanceMiles: null as number | null,
  selectedCategories: [] as string[],
  followingOnly: false,
  sort: "best" as SearchSort,
  locationMode: "all" as SearchLocationMode,
  manualLocation: null as GeoLocation | null,
  hasAppliedDefaultLocation: false,
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  ...INITIAL_STATE,
  setQuery: (query) => set({ query }),
  commitQuery: (query) => {
    const next = query ?? get().query;
    set({ query: next, committedQuery: next.trim() });
  },
  setMatchThreshold: (matchThreshold) => set({ matchThreshold }),
  setMatchPriorities: (matchPriorities) => set({ matchPriorities }),
  setSelectedVibes: (selectedVibes) => set({ selectedVibes }),
  setDistanceMiles: (distanceMiles) => set({ distanceMiles }),
  setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
  setFollowingOnly: (followingOnly) => set({ followingOnly }),
  setSort: (sort) => set({ sort }),
  setLocationMode: (locationMode) => set({ locationMode }),
  setManualLocation: (manualLocation) => set({ manualLocation }),
  setHasAppliedDefaultLocation: (hasAppliedDefaultLocation) =>
    set({ hasAppliedDefaultLocation }),
  clearFilters: () =>
    set({
      matchThreshold: null,
      matchPriorities: {},
      selectedVibes: [],
      distanceMiles: null,
      selectedCategories: [],
      followingOnly: false,
      sort: "best",
      locationMode: "all",
      manualLocation: null,
    }),
  reset: () => set(INITIAL_STATE),
}));
