export type SpotlightSectionKey =
  | "picks"
  | "lists"
  | "curators"
  | "collections"
  | "businesses";

export type SpotlightFallbackLevel =
  | "city"
  | "metro"
  | "state"
  | "country"
  | "worldwide";

export type SpotlightPickEntityDAO = {
  type: "pick";
  id: string;
  // The `SpotlightItem` row's own id — distinct from `id` above (the
  // underlying ListItem's id). This is the id the event-logging endpoints
  // (`items/<id>/impression|open|save|cta-click`) key on; `null` when the
  // entity has no backing SpotlightItem (sponsored slots only, see
  // SpotlightBusinessEntityDAO).
  spotlight_item_id: string | null;
  title: string;
  quote: string | null;
  image: string | null;
  curator_id: string;
  curator_name: string;
  save_count: number;
  featured_in_lists_count: number;
};

export type SpotlightListEntityDAO = {
  type: "list";
  id: string;
  spotlight_item_id: string | null;
  title: string;
  description: string | null;
  image: string | null;
  curator_id: string;
  curator_name: string;
  save_count: number;
};

export type SpotlightCuratorEntityDAO = {
  type: "curator";
  id: string;
  spotlight_item_id: string | null;
  name: string;
  quote: string | null;
  image: string | null;
  /** Null when the curator has no profile or hides personality via privacy settings. */
  personality_name: string | null;
  followers_count: number;
  list_count: number;
};

export type SpotlightBusinessEntityDAO = {
  type: "business";
  id: string;
  // `null` for the sponsored slot specifically — sponsored has no backing
  // `SpotlightItem` row (it's a `SpotlightSponsoredSlot`), so its impression/
  // visit/save/CTA counters aren't wired to these event-logging endpoints
  // (see spotlight/notifications.py's note on sponsored slots, plan.md §1.10).
  spotlight_item_id: string | null;
  name: string;
  category: string | null;
  description: string | null;
  image: string | null;
  is_verified: boolean;
  save_count: number;
};

export type SpotlightCollectionMemberDAO = {
  id: string;
  title: string;
  image: string | null;
  curator_id: string;
  curator_name: string;
  item_count: number;
  met_criteria: boolean;
};

export type SpotlightCollectionEntityDAO = {
  type: "collection";
  id: string;
  spotlight_item_id: string | null;
  met_criteria?: boolean;
  title: string;
  theme_id: string;
  description: string | null;
  cover_image: string | null;
  lists: SpotlightCollectionMemberDAO[];
};

export type SpotlightUnknownEntityDAO = {
  type: "unknown";
  id: string | null;
  spotlight_item_id: string | null;
};

export type SpotlightEntityDAO =
  | SpotlightPickEntityDAO
  | SpotlightListEntityDAO
  | SpotlightCuratorEntityDAO
  | SpotlightBusinessEntityDAO
  | SpotlightCollectionEntityDAO
  | SpotlightUnknownEntityDAO;

export type SpotlightSectionDAO = {
  section_key: SpotlightSectionKey;
  fallback_level: SpotlightFallbackLevel;
  fallback_label: string | null;
  items: SpotlightEntityDAO[];
};

export type SpotlightHeroDAO = {
  image: string | null;
  copy: string | null;
  kicker: string;
};

export type SpotlightEditionDAO = {
  edition_id: string;
  city: string;
  iso_week: string;
  week_start_date: string;
  week_end_date: string;
  hero: SpotlightHeroDAO;
  sections: SpotlightSectionDAO[];
  sponsored?: SpotlightEntityDAO;
};

export type SpotlightEditionDQO = {
  city?: string;
};
