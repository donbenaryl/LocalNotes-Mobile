import type { Href } from "expo-router";

interface ResolveSectionTabFromPathnameOptions {
  pathname: string;
  sectionSegment: string;
  defaultTabId: string;
  getActiveTabFromPathname: (pathname: string) => string;
  lastHref?: Href;
  currentActiveTab: string;
}

/**
 * Decide whether a pathname change should update local sub-tab state.
 * Prefers lastHrefBySection over stale router history (e.g. after Profile back).
 */
export function resolveSectionTabFromPathname({
  pathname,
  sectionSegment,
  defaultTabId,
  getActiveTabFromPathname,
  lastHref,
  currentActiveTab,
}: ResolveSectionTabFromPathnameOptions): string | null {
  if (!pathname.includes(sectionSegment)) return null;

  const pathnameTab = getActiveTabFromPathname(pathname);

  // Section-entry URLs must not clobber pager state when returning from stack.
  if (pathnameTab === defaultTabId) return null;

  const storeTab = lastHref
    ? getActiveTabFromPathname(String(lastHref))
    : null;

  // Stale URL in history — keep local/store tab; SectionPager will replace URL.
  if (storeTab && storeTab !== pathnameTab) return null;

  if (pathnameTab === currentActiveTab) return null;

  return pathnameTab;
}

/** Whether the runtime pathname reflects the given sub-tab id. */
export function pathnameMatchesTabId(pathname: string, tabId: string): boolean {
  switch (tabId) {
    case "home":
      return (
        pathname.includes("/home") &&
        !pathname.includes("/following") &&
        !pathname.includes("/spotlight") &&
        !pathname.includes("/offers")
      );
    case "following":
      return pathname.includes("/following");
    case "spotlight":
      return pathname.includes("/spotlight");
    case "offers":
      return pathname.includes("/offers");
    case "draft": {
      const segment = pathname.split("/").filter(Boolean).pop();
      return segment === "draft";
    }
    case "saved": {
      const segment = pathname.split("/").filter(Boolean).pop();
      return segment === "saved" && pathname.includes("/saved");
    }
    case "shared-with-me":
      return pathname.includes("/shared-with-me");
    case "picks":
      return pathname.includes("/search") && !pathname.includes("/lists") && !pathname.includes("/people");
    case "lists":
      return pathname.includes("/lists");
    case "people":
      return pathname.includes("/people");
    default:
      return pathname.includes(`/${tabId}`);
  }
}
