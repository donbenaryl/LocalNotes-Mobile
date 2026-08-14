import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import { usePathname, useRouter, type Href } from "expo-router";
import {
  getAdjacentSection,
  getSectionId,
  type SectionId,
} from "@/constants/swipeNavigation";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";
import { useSectionSwipeStore } from "@/stores/useSectionSwipeStore";
import { navigateToSection } from "@/utils/navigateToSection";
import { pathnameMatchesTabId } from "@/utils/sectionTabSync";

export interface SectionPagerPage {
  id: string;
  href: Href;
  render: () => ReactNode;
}

interface SectionPagerProps {
  pages: SectionPagerPage[];
  activeId: string;
  onActiveIdChange: (id: string) => void;
  /** Header / tab bar above the pager. */
  chrome?: ReactNode;
  /**
   * Footer section this pager belongs to. When set, "active" is derived from
   * pathname (shells stay mounted in SectionShellPager). Omit for stack
   * routes like Profile (falls back to useIsFocused).
   */
  sectionId?: SectionId;
  /**
   * When true, sizes to measured page content for use inside a parent
   * ScrollView instead of filling the remaining viewport height.
   */
  embedded?: boolean;
}

/**
 * Fraction of a page drag after which the tab bar treats the next sub-tab as
 * active. Small on purpose: the underline follows the finger instead of waiting
 * for the halfway point. Abandoned drags scroll back through the same threshold
 * and onPageSelected settles the final value, so it self-corrects.
 */
const PAGE_COMMIT_THRESHOLD = 0.15;
const SWIPE_DISTANCE_THRESHOLD = 72;
const SWIPE_VELOCITY_THRESHOLD = 700;
const FAIL_OFFSET_Y = 16;
const ACTIVE_OFFSET_X = 12;
const EDGE_STRIP_WIDTH = 28;
const EMBEDDED_MIN_HEIGHT = 200;
const PROFILE_HREF = "/profile" as Href;

/**
 * Inner-section PagerView for sub-tabs within a footer section.
 * Parent SectionShellPager swipe is enabled on the last sub-tab only when a
 * next section exists (not on Search — Profile uses the right-edge strip).
 * On the first sub-tab, a left-edge strip handles swipe-right → previous
 * section (Drafts → Smart Pick, Picks → Saved); directional offsets keep
 * swipe-left for the inner pager. On Search/People, a right-edge strip
 * handles swipe-left → Profile without stealing swipe-right.
 */
export function SectionPager({
  pages,
  activeId,
  onActiveIdChange,
  chrome,
  sectionId,
  embedded = false,
}: SectionPagerProps) {
  const { height: screenHeight } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const navigatingRef = useRef(false);
  const [pageHeights, setPageHeights] = useState<Record<string, number>>({});
  const router = useRouter();
  const pathname = usePathname();
  const isNavFocused = useIsFocused();
  const storeSection = useSectionRouteStore((s) => s.activeSection);
  const pathSection = getSectionId(pathname);
  // storeSection flips on the tap/swipe, so swipeEnabled, activeHref and the
  // edge strips all switch over instantly. The pathSection !== null clause
  // keeps this false while a stack route (Profile) sits on top — that is what
  // re-arms navigatingRef below.
  const isSectionActive = sectionId
    ? pathSection !== null && (storeSection ?? pathSection) === sectionId
    : isNavFocused;

  const setActiveHref = useSectionRouteStore((s) => s.setActiveHref);
  const rememberSectionHref = useSectionRouteStore(
    (s) => s.rememberSectionHref,
  );
  const requestSection = useSectionRouteStore((s) => s.requestSection);
  const setSwipeEnabled = useSectionSwipeStore((s) => s.setSwipeEnabled);

  const activeIndex = Math.max(
    0,
    pages.findIndex((page) => page.id === activeId),
  );
  const lastIndex = pages.length - 1;
  const nativePageRef = useRef(activeIndex);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const wasSectionActiveRef = useRef(isSectionActive);
  const isLayoutSettlingRef = useRef(false);
  const layoutSettleFrameRef = useRef<number | null>(null);
  const lastSyncedHrefRef = useRef<string | null>(null);
  const pageHeightsRef = useRef(pageHeights);
  pageHeightsRef.current = pageHeights;

  const syncNativePage = useCallback((index: number) => {
    nativePageRef.current = index;
    pagerRef.current?.setPageWithoutAnimation(index);
  }, []);

  const previousSection = sectionId
    ? getAdjacentSection(sectionId, "right")
    : null;
  const showPrevSectionStrip =
    Boolean(previousSection) && isSectionActive && activeIndex === 0;
  const showProfileStrip =
    sectionId === "search" && isSectionActive && activeIndex === lastIndex;

  useEffect(() => {
    if (nativePageRef.current === activeIndex) return;
    syncNativePage(activeIndex);
  }, [activeIndex, syncNativePage]);

  // Re-sync native page when section reactivates (e.g. back from Profile stack).
  useEffect(() => {
    const wasActive = wasSectionActiveRef.current;
    wasSectionActiveRef.current = isSectionActive;
    if (!isSectionActive || wasActive) return;
    syncNativePage(activeIndex);
  }, [isSectionActive, activeIndex, syncNativePage]);

  useEffect(() => {
    if (!isSectionActive) return;
    const page = pages[activeIndex];
    if (!page) return;
    rememberSectionHref(page.href);
    setActiveHref(page.href);
  }, [activeIndex, isSectionActive, pages, rememberSectionHref, setActiveHref]);

  // Silent URL sync — pathname intentionally omitted from deps to avoid replace loops.
  useEffect(() => {
    if (!isSectionActive || !sectionId) return;
    const page = pages[activeIndex];
    if (!page) return;

    if (pathnameMatchesTabId(pathname, page.id)) {
      lastSyncedHrefRef.current = String(page.href);
      return;
    }

    const hrefKey = String(page.href);
    if (lastSyncedHrefRef.current !== hrefKey) {
      lastSyncedHrefRef.current = hrefKey;
      router.replace(page.href);
    }
  }, [activeIndex, isSectionActive, pages, router, sectionId]);

  useEffect(() => {
    if (!isSectionActive) {
      navigatingRef.current = false;
      return;
    }
    const hasNextSection =
      sectionId != null && getAdjacentSection(sectionId, "left") != null;
    const allowParentSwipe =
      pages.length <= 1 || (activeIndex === lastIndex && hasNextSection);
    setSwipeEnabled(allowParentSwipe);
  }, [
    activeIndex,
    isSectionActive,
    lastIndex,
    pages.length,
    sectionId,
    setSwipeEnabled,
  ]);

  const navigateToPreviousSection = useCallback(() => {
    if (!sectionId || navigatingRef.current) return;
    const previous = getAdjacentSection(sectionId, "right");
    if (!previous) return;
    navigatingRef.current = true;
    const currentHref = pages[activeIndex]?.href;
    // Highlight and shell slide start on the gesture; the URL follows.
    requestSection(previous);
    navigateToSection(router, previous, { fromHref: currentHref });
  }, [activeIndex, pages, requestSection, router, sectionId]);

  const navigateToProfile = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push(PROFILE_HREF);
  }, [router]);

  const handlePrevSectionPanEnd = useCallback(
    (translationX: number, velocityX: number) => {
      if (navigatingRef.current) return;
      const committed =
        translationX > SWIPE_DISTANCE_THRESHOLD ||
        velocityX > SWIPE_VELOCITY_THRESHOLD;
      if (committed) navigateToPreviousSection();
    },
    [navigateToPreviousSection],
  );

  const handleProfilePanEnd = useCallback(
    (translationX: number, velocityX: number) => {
      if (navigatingRef.current) return;
      const committed =
        translationX < -SWIPE_DISTANCE_THRESHOLD ||
        velocityX < -SWIPE_VELOCITY_THRESHOLD;
      if (committed) navigateToProfile();
    },
    [navigateToProfile],
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      if (!isSectionActive || isLayoutSettlingRef.current) return;
      const index = event.nativeEvent.position;
      nativePageRef.current = index;
      const page = pages[index];
      if (page && page.id !== activeId) {
        onActiveIdChange(page.id);
      }
    },
    [activeId, isSectionActive, onActiveIdChange, pages],
  );

  const handlePageScroll = useCallback(
    (event: PagerViewOnPageScrollEvent) => {
      if (!isSectionActive || isLayoutSettlingRef.current) return;
      const { position, offset } = event.nativeEvent;
      const settledIndex =
        offset > PAGE_COMMIT_THRESHOLD ? position + 1 : position;
      const settledPage = pages[settledIndex];
      if (settledPage && settledPage.id !== activeId) {
        nativePageRef.current = settledIndex;
        onActiveIdChange(settledPage.id);
      }
    },
    [activeId, isSectionActive, onActiveIdChange, pages],
  );

  const handleEmbeddedPageLayout = useCallback(
    (pageId: string, event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height <= 0) return;
      if (pageHeightsRef.current[pageId] === height) return;

      isLayoutSettlingRef.current = true;
      setPageHeights((prev) => ({ ...prev, [pageId]: height }));

      if (layoutSettleFrameRef.current != null) {
        cancelAnimationFrame(layoutSettleFrameRef.current);
      }
      layoutSettleFrameRef.current = requestAnimationFrame(() => {
        layoutSettleFrameRef.current = null;
        syncNativePage(activeIndexRef.current);
        isLayoutSettlingRef.current = false;
      });
    },
    [syncNativePage],
  );

  const measuredMaxHeight = Math.max(
    EMBEDDED_MIN_HEIGHT,
    ...pages.map((page) => pageHeights[page.id] ?? 0),
  );
  const hasMeasuredHeights = pages.some((page) => pageHeights[page.id] != null);
  const embeddedPagerHeight = embedded
    ? hasMeasuredHeights
      ? measuredMaxHeight
      : screenHeight * 2
    : EMBEDDED_MIN_HEIGHT;

  const renderedPages = useMemo(
    () =>
      pages.map((page) => (
        <View
          key={page.id}
          style={embedded ? undefined : styles.fill}
          collapsable={false}
          onLayout={
            embedded
              ? (event) => handleEmbeddedPageLayout(page.id, event)
              : undefined
          }
        >
          {page.render()}
        </View>
      )),
    [embedded, handleEmbeddedPageLayout, pages],
  );

  const prevSectionPan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(showPrevSectionStrip)
        .activeOffsetX(ACTIVE_OFFSET_X)
        .failOffsetX(-ACTIVE_OFFSET_X)
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onEnd((event) => {
          "worklet";
          runOnJS(handlePrevSectionPanEnd)(
            event.translationX,
            event.velocityX,
          );
        }),
    [handlePrevSectionPanEnd, showPrevSectionStrip],
  );

  const profilePan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(showProfileStrip)
        .activeOffsetX(-ACTIVE_OFFSET_X)
        .failOffsetX(ACTIVE_OFFSET_X)
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onEnd((event) => {
          "worklet";
          runOnJS(handleProfilePanEnd)(
            event.translationX,
            event.velocityX,
          );
        }),
    [handleProfilePanEnd, showProfileStrip],
  );

  return (
    <View
      className={
        embedded
          ? "bg-page dark:bg-gray-900"
          : "flex-1 overflow-hidden bg-page dark:bg-gray-900"
      }
    >
      {chrome}
      <PagerView
        ref={pagerRef}
        style={embedded ? { height: embeddedPagerHeight } : styles.fill}
        initialPage={activeIndex}
        scrollEnabled={isSectionActive}
        overdrag={false}
        offscreenPageLimit={Math.max(pages.length - 1, 1)}
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}
      >
        {renderedPages}
      </PagerView>

      {showPrevSectionStrip ? (
        <GestureDetector gesture={prevSectionPan}>
          <View
            style={styles.leftStrip}
            collapsable={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </GestureDetector>
      ) : null}

      {showProfileStrip ? (
        <GestureDetector gesture={profilePan}>
          <View
            style={styles.rightStrip}
            collapsable={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  leftStrip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: EDGE_STRIP_WIDTH,
    zIndex: 20,
  },
  rightStrip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: EDGE_STRIP_WIDTH,
    zIndex: 20,
  },
});
