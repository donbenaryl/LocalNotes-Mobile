import type { Href } from "expo-router";
import {
  isSearchHref,
  SECTION_ENTRY_HREF,
  type SectionId,
} from "@/constants/swipeNavigation";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";

interface NavigateLike {
  navigate: (href: Href) => void;
}

/**
 * Href to open for a footer section: last visited sub-tab, or the section entry.
 */
export function resolveSectionHref(
  to: SectionId,
  forceEntry = false,
): Href {
  if (forceEntry) return SECTION_ENTRY_HREF[to];
  return (
    useSectionRouteStore.getState().lastHrefBySection[to] ??
    SECTION_ENTRY_HREF[to]
  );
}

/**
 * Keep-alive navigate into a footer section. Updates search returnTo when
 * crossing the search boundary.
 */
export function navigateToSection(
  router: NavigateLike,
  to: SectionId,
  options?: {
    forceEntry?: boolean;
    /** Leaving-page href; falls back to the focused activeHref. */
    fromHref?: Href | string | null;
  },
): void {
  const href = resolveSectionHref(to, options?.forceEntry ?? false);
  const { activeHref, exitHref } = useSectionRouteStore.getState();
  const toSearch = to === "search";

  // Prefer an explicit fromHref. If activeHref already flipped to Search
  // (requestSection → SectionPager race), fall back to exitHref.
  let fromHref: Href | string | null | undefined = options?.fromHref;
  if (fromHref == null) {
    if (activeHref && !(toSearch && isSearchHref(activeHref))) {
      fromHref = activeHref;
    } else if (exitHref && !isSearchHref(exitHref)) {
      fromHref = exitHref;
    } else {
      fromHref = activeHref;
    }
  }

  const fromSearch = fromHref ? isSearchHref(fromHref) : false;

  if (toSearch && !fromSearch && fromHref) {
    useSearchChromeStore.getState().setReturnTo(fromHref as Href);
  }
  if (fromSearch && !toSearch) {
    useSearchChromeStore.getState().setReturnTo(null);
  }

  router.navigate(href);
}
