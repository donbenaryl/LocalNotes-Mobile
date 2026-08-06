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
}

const PAGE_COMMIT_THRESHOLD = 0.5;
const SWIPE_DISTANCE_THRESHOLD = 72;
const SWIPE_VELOCITY_THRESHOLD = 700;
const FAIL_OFFSET_Y = 16;
const EDGE_STRIP_WIDTH = 28;

/**
 * Inner-section PagerView for sub-tabs within a footer section.
 * Parent SectionShellPager swipe is enabled on the last sub-tab only.
 * On the first sub-tab, a left-edge strip handles swipe-right → previous
 * section (Drafts → Smart Pick, Picks → Saved) without stealing left-swipes.
 */
export function SectionPager({
  pages,
  activeId,
  onActiveIdChange,
  chrome,
  sectionId,
}: SectionPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const navigatingRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const isNavFocused = useIsFocused();
  const isSectionActive = sectionId
    ? getSectionId(pathname) === sectionId
    : isNavFocused;

  const setActiveHref = useSectionRouteStore((s) => s.setActiveHref);
  const rememberSectionHref = useSectionRouteStore(
    (s) => s.rememberSectionHref,
  );
  const setSwipeEnabled = useSectionSwipeStore((s) => s.setSwipeEnabled);

  const activeIndex = Math.max(
    0,
    pages.findIndex((page) => page.id === activeId),
  );
  const lastIndex = pages.length - 1;
  const nativePageRef = useRef(activeIndex);

  const showPrevSectionStrip =
    Boolean(sectionId) && isSectionActive && activeIndex === 0;

  useEffect(() => {
    if (nativePageRef.current === activeIndex) return;
    nativePageRef.current = activeIndex;
    pagerRef.current?.setPageWithoutAnimation(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    const href = pages[activeIndex]?.href;
    if (!href) return;
    rememberSectionHref(href);
    if (isSectionActive) setActiveHref(href);
  }, [
    activeIndex,
    isSectionActive,
    pages,
    rememberSectionHref,
    setActiveHref,
  ]);

  useEffect(() => {
    if (!isSectionActive) {
      navigatingRef.current = false;
      return;
    }
    const allowParentSwipe =
      pages.length <= 1 || activeIndex === lastIndex;
    setSwipeEnabled(allowParentSwipe);
  }, [
    activeIndex,
    isSectionActive,
    lastIndex,
    pages.length,
    setSwipeEnabled,
  ]);

  const navigateToPreviousSection = useCallback(() => {
    if (!sectionId || navigatingRef.current) return;
    navigatingRef.current = true;
    const previous = getAdjacentSection(sectionId, "right");
    const currentHref = pages[activeIndex]?.href;
    navigateToSection(router, previous, { fromHref: currentHref });
  }, [activeIndex, pages, router, sectionId]);

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
      const settledIndex =
        offset > PAGE_COMMIT_THRESHOLD ? position + 1 : position;
      const settledPage = pages[settledIndex];
      if (settledPage && settledPage.id !== activeId) {
        nativePageRef.current = settledIndex;
        onActiveIdChange(settledPage.id);
      }
    },
    [activeId, onActiveIdChange, pages],
  );

  const renderedPages = useMemo(
    () =>
      pages.map((page) => (
        <View key={page.id} style={styles.fill} collapsable={false}>
          {page.render()}
        </View>
      )),
    [pages],
  );

  const prevSectionPan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(showPrevSectionStrip)
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

  return (
    <View className="flex-1 overflow-hidden bg-page dark:bg-gray-900">
      {chrome}
      <PagerView
        ref={pagerRef}
        style={styles.fill}
        initialPage={activeIndex}
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
});
