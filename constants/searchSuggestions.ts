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

export type SearchSuggestionSource =
  | "vibe_answers"
  | "vibe_often"
  | "popular_city"
  | "trending"
  | "your_searches"
  | "prefix";

export type SearchSuggestion = {
  label: string;
  source: SearchSuggestionSource;
  /** Used for `popular_city` reason copy ("Popular in {{city}}"). */
  city?: string;
};

export type SearchFollowPick = {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  place: string;
  /** Omitted when the viewer has no comparable personality match with the author. */
  matchPercent?: number;
  username: string;
  imageUrl: string;
  reason?: string;
};
