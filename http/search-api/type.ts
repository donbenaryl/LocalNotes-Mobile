import { type ListItemDAO } from "../list-api/types";
import { type BusinessItemDAO } from "../business-api/types";
export interface searchDAO {
  businesses: BusinessItemDAO[];
  lists: ListItemDAO[];
  people: [
    {
      name: string;
      id: string;
      profile_image_url: string;
      list_count?: number;
      followers_count?: number;
      account_is_followed?: boolean;
      personality_name?: string;
      personality_color?: Record<string, number>;
      bio?: string;
      similarScores?: {
        reason: {
          overall_score: number;
        };
      };
      similar_scores?: {
        reason: {
          overall_score: number;
        };
      };
    },
  ];
}

export interface UnifiedSearchPersonDAO {
  id: string;
  name: string;
  username: string;
  profile_image_url: string | null;
  bio: string | null;
  personality_description: string | null;
  followers_count: number;
  personality_name: string | null;
  personality_color?: Record<string, number> | null;
  list_count: number;
  match: number;
}

export interface UnifiedSearchPeopleResultDAO {
  businesses: BusinessItemDAO[];
  lists: ListItemDAO[];
  people: UnifiedSearchPersonDAO[];
}

export interface UnifiedSearchPeopleQueryDTO {
  scope: "people";
  limit: number;
  sort_by: "match";
  sort_order: "desc" | "asc";
}

export type SearchTypeEnum =
  | "individual_lists"
  | "people_i_follow"
  | "trending_now";

export type UnifiedSearchSortBy = "match" | "created_at";
export type UnifiedSearchSortOrder = "asc" | "desc";

export interface UnifiedSearchParams {
  query: string;
  type: SearchTypeEnum;
  categoryIds?: string[];
  longitude?: number;
  latitude?: number;
  radiusKm?: number;
  matchMin?: number;
  matchMax?: number;
  vibes?: string[];
  sortBy?: UnifiedSearchSortBy;
  sortOrder?: UnifiedSearchSortOrder;
  limit?: number;
}

export interface UnifiedSearchResultDAO {
  businesses: BusinessItemDAO[];
  lists: ListItemDAO[];
  people: UnifiedSearchPersonDAO[];
}

export interface SearchFilters {
  location?: {
    name: string;
    coordinates: [number, number];
  };
  searchType: SearchTypeEnum;
  categoryIds?: string[];
  matchScoreRange?: [number, number];
}
