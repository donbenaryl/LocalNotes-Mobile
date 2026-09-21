export type ReviewProviderId = "google" | "yelp" | "amazon" | "tripadvisor";

export type ReviewSyncStatus = "idle" | "syncing" | "failed";

export interface ReviewConnectionDAO {
  provider: ReviewProviderId;
  connected: boolean;
  review_count?: number | null;
  last_synced_at?: string | null;
  sync_status?: ReviewSyncStatus | null;
  last_error?: string | null;
  coming_soon?: boolean;
}

export interface ImportedReviewDAO {
  id: string;
  provider: ReviewProviderId;
  external_id: string;
  place_name: string;
  place_address: string;
  place_category: string;
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url: string;
  rating?: number | null;
  body: string;
  published_at?: string | null;
  helpful_count?: number | null;
  source_url: string;
  author_id: string;
  author_name: string;
  author_username?: string | null;
  author_profile_image_url?: string | null;
  author_personality_name?: string | null;
  created_at: string;
}

export interface ReviewSummaryDAO {
  total: number;
  by_provider: Record<ReviewProviderId, number>;
}

export interface GoogleConnectDTO {
  code: string;
  code_verifier: string;
  redirect_uri: string;
}
