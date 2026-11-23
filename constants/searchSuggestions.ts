/**
 * Maps personality trait-side labels → search starter phrases.
 * Matches the Search-Nov-23 design mock; extend as needed.
 */
export const TRAIT_SIDE_TO_SUGGESTION: Record<string, string> = {
  "Quiet and Peaceful": "Quiet places",
  "Hidden Gem": "Hidden gems",
  "Local Favorites": "Local favorites",
  "Outdoor Movement": "Outdoor spots",
  "Active Adventure": "Adventure",
  "Budget-Friendly": "Cheap eats",
  "Atmosphere-Driven Experience": "Date night",
  "Loud and Lively": "Nightlife",
  "Premium Experience": "Rooftop",
};

/** Max rows in the "Suggested for you" dropdown. */
export const SEARCH_SUGGESTIONS_LIMIT = 5;

/**
 * Extension point for a later "Popular in {city}" row once a backend exists.
 * Keep this type stable so the builder can append without reshaping callers.
 */
export type SearchSuggestionSource =
  | "vibe_answers"
  | "vibe_often"
  | "popular_city";

export type SearchSuggestion = {
  label: string;
  source: SearchSuggestionSource;
  /** Used for `popular_city` reason copy ("Popular in {{city}}"). */
  city?: string;
};

/** FE-only fallback when personality / vibe history yield no rows. */
export const MOCK_SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { label: "Quiet places", source: "vibe_answers" },
  { label: "Hidden gems", source: "vibe_answers" },
  { label: "Outdoor spots", source: "vibe_answers" },
  { label: "Peaceful spots", source: "vibe_often" },
  { label: "Date night", source: "popular_city", city: "Las Vegas" },
];

export type SearchFollowPick = {
  id: string;
  title: string;
  category: string;
  place: string;
  matchPercent: number;
  username: string;
  imageUrl: string;
  reason?: string;
};

/** FE-only "New from people you follow" rows. */
export const MOCK_FOLLOWING_PICKS: SearchFollowPick[] = [
  {
    id: "mock-follow-1",
    title: "Skyline Rooftop Lounge",
    category: "Food & Drinks",
    place: "The Strip",
    matchPercent: 84,
    username: "jordan22",
    imageUrl: "https://picsum.photos/seed/skyline-rooftop/160/160",
  },
  {
    id: "mock-follow-2",
    title: "Neon Boneyard Night Tour",
    category: "Art & Culture",
    place: "Downtown",
    matchPercent: 69,
    username: "jordan22",
    imageUrl: "https://picsum.photos/seed/neon-boneyard/160/160",
  },
  {
    id: "mock-follow-3",
    title: "Calico Tanks Trail",
    category: "Outdoor & Adventure",
    place: "Red Rock",
    matchPercent: 77,
    username: "desertwalker",
    imageUrl: "https://picsum.photos/seed/calico-tanks/160/160",
    reason: "Matches your preference for hidden gems and getting outdoors",
  },
];
