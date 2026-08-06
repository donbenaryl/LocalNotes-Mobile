import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { usePathname, useRouter, type Href } from "expo-router";
import {
  CROSS_SECTION_ENTER_OFFSET,
  isSearchHref,
  isSearchPathname,
  pathnameToAppHref,
} from "@/constants/swipeNavigation";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";
import {
  useSwipeTransitionStore,
  type SwipeEnterDirection,
} from "@/stores/useSwipeTransitionStore";

export interface SectionPagerPage {
  id: string;
  href: Href;
  render: () => ReactNode;
}

interface SectionPagerProps {
  pages: SectionPagerPage[];
  activeId: string;
  onActiveIdChange: (id: string) => void;
  /** Cross-section: swipe left on the last page. */
  edgeLeftHref?: Href;
  /** Cross-section: swipe right on the first page. */
  edgeRightHref?: Href;
  /** Cross-section: swipe right on the last page (e.g. Saved/Shared → Smart Pick). */
  edgeRightFromLastHref?: Href;
}

type OverscrollArm = SwipeEnterDirection | null;

/** Fraction of a page swiped past which the next tab is treated as selected. */
const PAGE_COMMIT_THRESHOLD = 0.5;

/**
 * Keeps every section tab mounted in a native PagerView so within-section
 * swipes show live neighbors. Outward overscroll on the first/last page
 * triggers cross-section navigation without a blank peek panel.
 */
export function SectionPager({
  pages,
  activeId,
  onActiveIdChange,
  edgeLeftHref,
  edgeRightHref,
  edgeRightFromLastHref,
}: SectionPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const overscrollArm = useRef<OverscrollArm>(null);
  const navigatingRef = useRef(false);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const router = useRouter();
  const setReturnTo = useSearchChromeStore((s) => s.setReturnTo);
  const setActiveHref = useSectionRouteStore((s) => s.setActiveHref);
  const setEnterTransition = useSwipeTransitionStore(
    (s) => s.setEnterTransition,
  );

  const activeIndex = Math.max(
    0,
    pages.findIndex((page) => page.id === activeId),
  );
  const lastIndex = pages.length - 1;

  /** Where the native pager actually sits, so we never replay its own move. */
  const nativePageRef = useRef(activeIndex);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Only tap-driven changes reach here — a swipe updates nativePageRef in
  // onPageSelected first, so its own animation is never replayed. Taps jump
  // without animation because PagerView's animated duration is fixed natively
  // and too slow for a tab bar; swipes keep their follow-the-finger motion.
  useEffect(() => {
    if (nativePageRef.current === activeIndex) return;
    nativePageRef.current = activeIndex;
    pagerRef.current?.setPageWithoutAnimation(activeIndex);
  }, [activeIndex]);

  // Cross-section navigation arms an enter transition that only Smart Pick
  // consumes; drop any leftover so it can't replay on a later mount.
  useEffect(() => {
    useSwipeTransitionStore.getState().clearEnterTransition();
  }, []);

  // Publish the visible page so outside chrome (the footer) can read the tab
  // the user is actually on — the URL only names the section. Never cleared on
  // unmount: the next section mounts before this one tears down, and a clear
  // would race it. Readers guard against a stale section instead.
  useEffect(() => {
    const href = pages[activeIndex]?.href;
    if (href) setActiveHref(href);
  }, [activeIndex, pages, setActiveHref]);

  const navigateCrossSection = useCallback(
    (direction: SwipeEnterDirection, href: Href) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      // The URL only names the section, so the active page's own href is the
      // accurate return target — not the pathname.
      const currentHref = pages[activeIndex]?.href;
      const fromSearch = currentHref
        ? isSearchHref(currentHref)
        : isSearchPathname(pathnameRef.current);
      const toSearch = isSearchHref(href);
      if (toSearch && !fromSearch) {
        setReturnTo(currentHref ?? pathnameToAppHref(pathnameRef.current));
      }
      if (fromSearch && !toSearch) {
        setReturnTo(null);
      }

      setEnterTransition(
        direction,
        direction === "left"
          ? CROSS_SECTION_ENTER_OFFSET
          : -CROSS_SECTION_ENTER_OFFSET,
      );
      router.replace(href);
    },
    [activeIndex, pages, router, setEnterTransition, setReturnTo],
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const index = event.nativeEvent.position;
      nativePageRef.current = index;
      const page = pages[index];
      if (page && page.id !== activeId) {
        onActiveIdChange(page.id);
      }
    },
    [activeId, onActiveIdChange, pages],
  );

  const handlePageScroll = useCallback(
    (event: PagerViewOnPageScrollEvent) => {
      const { position, offset } = event.nativeEvent;

      // Flip the tab as soon as the swipe passes the midpoint. Waiting for
      // onPageSelected leaves the tab bar trailing the gesture, because iOS
      // only fires it once the settle animation has finished.
      const settledIndex =
        offset > PAGE_COMMIT_THRESHOLD ? position + 1 : position;
      const settledPage = pages[settledIndex];
      if (settledPage && settledPage.id !== activeId) {
        // Claim the destination so the setPage effect reads this as the pager's
        // own move and doesn't yank it back mid-gesture. Dragging back below the
        // midpoint reverts both this and the tab through the same branch.
        nativePageRef.current = settledIndex;
        onActiveIdChange(settledPage.id);
      }

      // Pulling past the first page (right / previous section).
      if (position === 0 && offset < -0.08 && edgeRightHref) {
        overscrollArm.current = "right";
        return;
      }
      // Pulling past the last page (left / next section).
      if (position === lastIndex && offset > 0.08 && edgeLeftHref) {
        overscrollArm.current = "left";
        return;
      }
      // Last page pulled backward (right) — e.g. Shared → Smart Pick.
      if (
        position === lastIndex &&
        offset < -0.08 &&
        edgeRightFromLastHref
      ) {
        overscrollArm.current = "right";
        return;
      }

      if (offset > -0.03 && offset < 0.03) {
        overscrollArm.current = null;
      }
    },
    [
      activeId,
      edgeLeftHref,
      edgeRightFromLastHref,
      edgeRightHref,
      lastIndex,
      onActiveIdChange,
      pages,
    ],
  );

  const flushOverscroll = useCallback(() => {
    const arm = overscrollArm.current;
    overscrollArm.current = null;
    if (!arm) return;

    if (arm === "left" && edgeLeftHref) {
      navigateCrossSection("left", edgeLeftHref);
      return;
    }
    if (arm === "right") {
      const href = activeIndex <= 0 ? edgeRightHref : edgeRightFromLastHref;
      if (href) navigateCrossSection("right", href);
    }
  }, [
    activeIndex,
    edgeLeftHref,
    edgeRightFromLastHref,
    edgeRightHref,
    navigateCrossSection,
  ]);

  // Built once per `pages` identity, never per `activeId`. Stable element
  // references let React bail out of every page subtree on a tab tap, so the
  // tab highlight paints immediately instead of waiting on a commit that
  // re-renders all the feeds.
  const renderedPages = useMemo(
    () =>
      pages.map((page) => (
        <View key={page.id} style={styles.fill} collapsable={false}>
          {page.render()}
        </View>
      )),
    [pages],
  );

  const handleScrollStateChange = useCallback(
    (event: { nativeEvent: { pageScrollState: string } }) => {
      const state = event.nativeEvent.pageScrollState;

      if (state === "idle") {
        flushOverscroll();
        navigatingRef.current = false;
      }
    },
    [flushOverscroll],
  );

  return (
    <PagerView
      ref={pagerRef}
      style={styles.fill}
      initialPage={activeIndex}
      overdrag
      offscreenPageLimit={Math.max(pages.length - 1, 1)}
      onPageScroll={handlePageScroll}
      onPageScrollStateChanged={handleScrollStateChange}
      onPageSelected={handlePageSelected}
    >
      {renderedPages}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
