import type { Href } from "expo-router";

export type SwipeEnterDirection = "left" | "right";

export interface SwipeTargets {
  /** Destination when the user swipes left (next page). */
  left?: Href;
  /** Destination when the user swipes right (previous page). */
  right?: Href;
}

export const HOME_HREF = "/(app)/(tabs)/home" as const;
const HOME_FOLLOWING = "/(app)/(tabs)/home/following" as const;
const HOME_SPOTLIGHT = "/(app)/(tabs)/home/spotlight" as const;
const HOME_OFFERS = "/(app)/(tabs)/home/offers" as const;
export const SMART_PICK = "/(app)/(tabs)/smart-pick" as const;
export const SAVED_DRAFT = "/(app)/(tabs)/saved/draft" as const;
const SAVED_SAVED = "/(app)/(tabs)/saved/saved" as const;
const SAVED_SHARED = "/(app)/(tabs)/saved/shared-with-me" as const;
export const SEARCH_PICKS = "/(app)/(tabs)/search/picks" as const;
const SEARCH_LISTS = "/(app)/(tabs)/search/lists" as const;
const SEARCH_PLACES = "/(app)/(tabs)/search/businesses" as const;
const SEARCH_PEOPLE = "/(app)/(tabs)/search/people" as const;

export function isSearchHref(href: Href | string): boolean {
  return String(href).includes("/search");
}

export function isSearchPathname(pathname: string): boolean {
  return pathname.includes("/search");
}

/**
 * Maps a runtime pathname (no route groups) to an Expo Router Href for
 * replace/push. Falls back to Home for unrecognized paths.
 */
export function pathnameToAppHref(pathname: string): Href {
  if (pathname.includes("/home/offers")) return HOME_OFFERS;
  if (pathname.includes("/home/spotlight")) return HOME_SPOTLIGHT;
  if (pathname.includes("/home/following")) return HOME_FOLLOWING;
  if (pathname.includes("/home")) return HOME_HREF;

  if (/\/smart-pick\/?$/.test(pathname)) return SMART_PICK;

  if (pathname.includes("/saved/shared-with-me")) return SAVED_SHARED;
  if (pathname.includes("/saved/saved")) return SAVED_SAVED;
  if (pathname.includes("/saved/draft") || pathname.includes("/saved")) {
    return SAVED_DRAFT;
  }

  if (pathname.includes("/search/people")) return SEARCH_PEOPLE;
  if (pathname.includes("/search/businesses")) return SEARCH_PLACES;
  if (pathname.includes("/search/lists")) return SEARCH_LISTS;
  if (pathname.includes("/search")) return SEARCH_PICKS;

  return HOME_HREF;
}

/**
 * Resolves left/right swipe destinations for main feed/search shells.
 * Returns empty targets for routes outside the swipe graph.
 */
export function getSwipeTargets(pathname: string): SwipeTargets {
  if (pathname.includes("/search/people")) {
    return { left: HOME_HREF, right: SEARCH_PLACES };
  }
  if (pathname.includes("/search/businesses")) {
    return { left: SEARCH_PEOPLE, right: SEARCH_LISTS };
  }
  if (pathname.includes("/search/lists")) {
    return { left: SEARCH_PLACES, right: SEARCH_PICKS };
  }
  if (pathname.includes("/search/picks") || pathname.includes("/search")) {
    return { left: SEARCH_LISTS, right: SAVED_SHARED };
  }

  if (pathname.includes("/saved/shared-with-me")) {
    return { left: SEARCH_PICKS, right: SMART_PICK };
  }
  if (pathname.includes("/saved/saved")) {
    return { left: SAVED_SHARED, right: SAVED_DRAFT };
  }
  if (pathname.includes("/saved/draft") || pathname.includes("/saved")) {
    return { left: SAVED_SAVED, right: SMART_PICK };
  }

  // Only the Smart Pick form tab — not stack history/detail routes.
  if (/\/smart-pick\/?$/.test(pathname)) {
    return { left: SAVED_DRAFT, right: HOME_HREF };
  }

  if (pathname.includes("/home/offers")) {
    return { left: SMART_PICK, right: HOME_SPOTLIGHT };
  }
  if (pathname.includes("/home/spotlight")) {
    return { left: HOME_OFFERS, right: HOME_FOLLOWING };
  }
  if (pathname.includes("/home/following")) {
    return { left: HOME_SPOTLIGHT, right: HOME_HREF };
  }
  if (pathname.includes("/home")) {
    return { left: HOME_FOLLOWING, right: SEARCH_PICKS };
  }

  return {};
}

export type SectionId = "home" | "smart-pick" | "saved" | "search";

/** Canonical forward (swipe-left) order of the section ring. */
export const SECTION_ORDER: readonly SectionId[] = [
  "home",
  "smart-pick",
  "saved",
  "search",
] as const;

/**
 * First page of each section. Footer taps and cross-section jumps land here;
 * keep-alive Tabs restore each shell's local inner-tab state on return.
 */
export const SECTION_ENTRY_HREF: Record<SectionId, Href> = {
  home: HOME_HREF,
  "smart-pick": SMART_PICK,
  saved: SAVED_DRAFT,
  search: SEARCH_PICKS,
};

/**
 * Section a runtime pathname belongs to. Returns null for stack/detail routes
 * outside the ring (e.g. smart-pick/history, lists/[id]).
 */
export function getSectionId(pathname: string): SectionId | null {
  if (pathname.includes("/search")) return "search";
  if (pathname.includes("/saved")) return "saved";
  // Only the Smart Pick form tab — not stack history/detail routes.
  if (/\/smart-pick\/?$/.test(pathname)) return "smart-pick";
  if (pathname.includes("/home")) return "home";
  return null;
}

/**
 * Which way the ring turns between two sections: "left" = forward (content
 * slides in from the right), "right" = backward. Takes the shorter way round,
 * breaking ties by SECTION_ORDER so opposite jumps stay mirror images.
 */
export function getSectionDirection(
  from: SectionId,
  to: SectionId,
): SwipeEnterDirection {
  const fromIndex = SECTION_ORDER.indexOf(from);
  const toIndex = SECTION_ORDER.indexOf(to);
  const count = SECTION_ORDER.length;
  const forward = (toIndex - fromIndex + count) % count;
  const backward = (fromIndex - toIndex + count) % count;

  if (forward !== backward) return forward < backward ? "left" : "right";
  return toIndex > fromIndex ? "left" : "right";
}
