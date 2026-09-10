import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import PagerView, {
  type PageScrollStateChangedNativeEvent,
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { usePathname, useRouter } from "expo-router";
import MainHome from "@/components/PageComponents/Home/MainHome";
import MainSaved from "@/components/PageComponents/Saved/MainSaved";
import MainSearch from "@/components/PageComponents/Search/MainSearch";
import { SmartPickTab } from "@/components/PageComponents/SmartPick/SmartPickTab";
import {
  FillPagerView,
  pagerPageFillStyle,
} from "@/components/ui/FillPagerView";
import {
  getSectionId,
  SECTION_ORDER,
  type SectionId,
} from "@/constants/swipeNavigation";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";
import { useSectionSwipeStore } from "@/stores/useSectionSwipeStore";
import { navigateToSection } from "@/utils/navigateToSection";

/**
 * Fraction of a page drag after which the footer treats the next section as
 * active. Deliberately small: the highlight should follow the finger, not wait
 * for the halfway point. Abandoned drags scroll back through the same
 * threshold, so the highlight reverts on its own.
 */
const SECTION_COMMIT_THRESHOLD = 0.15;

/**
 * Android ViewPager2 blanks RN ScrollView/FlatList feeds. Mount only the
 * active footer section there (footer taps + router still switch sections).
 * iOS keeps the swipable outer pager.
 */
const USE_OUTER_PAGER = Platform.OS !== "android";

/**
 * Source of truth for footer-section swipe order (SECTION_ORDER).
 * Expo Tabs underneath only keep URLs / deep links in sync.
 * Returns null for stack routes (e.g. Profile) so the pager stays put.
 */
function sectionIndexFromPathname(pathname: string): number | null {
  const section = getSectionId(pathname);
  if (!section) return null;
  const index = SECTION_ORDER.indexOf(section);
  return index === -1 ? null : index;
}

function renderSection(section: SectionId): ReactNode {
  switch (section) {
    case "home":
      return (
        <View style={styles.fill} className="bg-page dark:bg-gray-900">
          <MainHome />
        </View>
      );
    case "smart-pick":
      return (
        <View style={styles.fill} className="bg-page dark:bg-gray-900">
          <SmartPickTab />
        </View>
      );
    case "saved":
      return (
        <View style={styles.fill} className="bg-page dark:bg-gray-900">
          <MainSaved />
        </View>
      );
    case "search":
      return (
        <View style={styles.fill} className="bg-page dark:bg-gray-900">
          <MainSearch />
        </View>
      );
  }
}

/**
 * The pager follows useSectionRouteStore.activeSection, which taps and swipes
 * set optimistically. The URL is downstream — onPageSelected navigates only to
 * let the router catch up, so nothing visible waits on a router commit.
 */
export function SectionShellPager() {
  const pagerRef = useRef<PagerView>(null);
  const router = useRouter();
  const pathname = usePathname();
  const swipeEnabled = useSectionSwipeStore((s) => s.swipeEnabled);
  const setSwipeEnabled = useSectionSwipeStore((s) => s.setSwipeEnabled);
  const activeSection = useSectionRouteStore((s) => s.activeSection);
  const pendingSection = useSectionRouteStore((s) => s.pendingSection);
  const requestSection = useSectionRouteStore((s) => s.requestSection);
  const syncSectionFromPathname = useSectionRouteStore(
    (s) => s.syncSectionFromPathname,
  );

  const bootIndex = sectionIndexFromPathname(pathname) ?? 0;
  const nativeIndexRef = useRef(bootIndex);
  /**
   * Target of an in-flight setPage. A programmatic move scrolls *through* the
   * pages between here and there, and onPageScroll fires the whole way — without
   * this the highlight would flicker across every intervening section.
   */
  const programmaticIndexRef = useRef<number | null>(null);

  // The incoming section's SectionPager now becomes active mid-drag, and it may
  // want parent swipe off. Applying that while the finger is still down would
  // cancel the very gesture that triggered it, so hold changes until idle.
  const [scrollEnabled, setScrollEnabled] = useState(swipeEnabled);
  const isPagerIdleRef = useRef(true);

  useEffect(() => {
    if (!USE_OUTER_PAGER) return;
    if (!isPagerIdleRef.current) return;
    setScrollEnabled(swipeEnabled);
  }, [swipeEnabled]);

  const handlePageScrollStateChanged = useCallback(
    (event: PageScrollStateChangedNativeEvent) => {
      const state = event.nativeEvent.pageScrollState;
      const isIdle = state === "idle";
      isPagerIdleRef.current = isIdle;
      // Settling is the only state a programmatic move can still be running in;
      // anything else means it finished or the user grabbed the pager instead.
      if (state !== "settling") programmaticIndexRef.current = null;
      if (isIdle) {
        setScrollEnabled(useSectionSwipeStore.getState().swipeEnabled);
      }
    },
    [],
  );

  useEffect(() => {
    const index = activeSection ? SECTION_ORDER.indexOf(activeSection) : -1;
    if (index < 0) return;

    // Smart Pick has no inner SectionPager — always allow parent swipe there.
    if (activeSection === "smart-pick") {
      setSwipeEnabled(true);
    }

    if (!USE_OUTER_PAGER) return;
    if (nativeIndexRef.current === index) return;

    nativeIndexRef.current = index;
    programmaticIndexRef.current = index;
    pagerRef.current?.setPage(index);
  }, [activeSection, setSwipeEnabled]);

  useEffect(() => {
    // Stack routes (Profile, list detail, …) leave the shell on its last section.
    const pathSection = getSectionId(pathname);
    if (!pathSection) return;
    // pendingSection in the deps so a request for the section we are already
    // on (swipe out and back) still gets cleared instead of sticking.
    syncSectionFromPathname(pathSection);
  }, [pathname, pendingSection, syncSectionFromPathname]);

  const handlePageScroll = useCallback(
    (event: PagerViewOnPageScrollEvent) => {
      if (programmaticIndexRef.current !== null) return;
      const { position, offset } = event.nativeEvent;
      const settledIndex =
        offset > SECTION_COMMIT_THRESHOLD ? position + 1 : position;
      const section: SectionId | undefined = SECTION_ORDER[settledIndex];
      if (!section) return;
      // Must precede requestSection, or the effect above fights the gesture.
      nativeIndexRef.current = settledIndex;
      requestSection(section);
    },
    [requestSection],
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const index = event.nativeEvent.position;
      nativeIndexRef.current = index;

      // Every programmatic path (footer tap, edge strip, deep link) has already
      // dealt with the URL, so there is nothing to catch up.
      const wasProgrammatic = programmaticIndexRef.current === index;
      programmaticIndexRef.current = null;
      if (wasProgrammatic) return;

      const section: SectionId | undefined = SECTION_ORDER[index];
      if (!section) return;
      // URL catch-up only — this is the tail of a user swipe.
      if (getSectionId(pathname) === section) return;

      navigateToSection(router, section);
    },
    [pathname, router],
  );

  if (!USE_OUTER_PAGER) {
    const section =
      activeSection ?? SECTION_ORDER[bootIndex] ?? SECTION_ORDER[0];
    return (
      <View style={styles.fill} collapsable={false}>
        {renderSection(section)}
      </View>
    );
  }

  return (
    <FillPagerView
      ref={pagerRef}
      style={styles.fill}
      initialPage={bootIndex}
      scrollEnabled={scrollEnabled}
      offscreenPageLimit={SECTION_ORDER.length - 1}
      onPageScroll={handlePageScroll}
      onPageScrollStateChanged={handlePageScrollStateChanged}
      onPageSelected={handlePageSelected}
    >
      <View key="home" style={pagerPageFillStyle} collapsable={false}>
        {renderSection("home")}
      </View>
      <View key="smart-pick" style={pagerPageFillStyle} collapsable={false}>
        {renderSection("smart-pick")}
      </View>
      <View key="saved" style={pagerPageFillStyle} collapsable={false}>
        {renderSection("saved")}
      </View>
      <View key="search" style={pagerPageFillStyle} collapsable={false}>
        {renderSection("search")}
      </View>
    </FillPagerView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
});
