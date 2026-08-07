import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { usePathname, useRouter } from "expo-router";
import MainHome from "@/components/PageComponents/Home/MainHome";
import MainSaved from "@/components/PageComponents/Saved/MainSaved";
import MainSearch from "@/components/PageComponents/Search/MainSearch";
import { SmartPickTab } from "@/components/PageComponents/SmartPick/SmartPickTab";
import {
  getSectionId,
  SECTION_ORDER,
  type SectionId,
} from "@/constants/swipeNavigation";
import { useSectionSwipeStore } from "@/stores/useSectionSwipeStore";
import { navigateToSection } from "@/utils/navigateToSection";

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

export function SectionShellPager() {
  const pagerRef = useRef<PagerView>(null);
  const syncingFromPathRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const swipeEnabled = useSectionSwipeStore((s) => s.swipeEnabled);
  const setSwipeEnabled = useSectionSwipeStore((s) => s.setSwipeEnabled);

  const pathIndex = sectionIndexFromPathname(pathname);
  const bootIndex = pathIndex ?? 0;
  const nativeIndexRef = useRef(bootIndex);

  useEffect(() => {
    // Stack routes (Profile, list detail, …) leave the shell on its last section.
    if (pathIndex === null) return;

    // Smart Pick has no inner SectionPager — always allow parent swipe there.
    if (SECTION_ORDER[pathIndex] === "smart-pick") {
      setSwipeEnabled(true);
    }

    if (nativeIndexRef.current === pathIndex) return;

    syncingFromPathRef.current = true;
    nativeIndexRef.current = pathIndex;
    pagerRef.current?.setPage(pathIndex);
  }, [pathIndex, setSwipeEnabled]);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const index = event.nativeEvent.position;
      nativeIndexRef.current = index;

      if (syncingFromPathRef.current) {
        syncingFromPathRef.current = false;
        return;
      }

      const section: SectionId | undefined = SECTION_ORDER[index];
      if (!section) return;
      if (getSectionId(pathname) === section) return;

      navigateToSection(router, section);
    },
    [pathname, router],
  );

  return (
    <PagerView
      ref={pagerRef}
      style={styles.fill}
      initialPage={bootIndex}
      scrollEnabled={swipeEnabled}
      offscreenPageLimit={SECTION_ORDER.length - 1}
      onPageSelected={handlePageSelected}
    >
      <View key="home" style={styles.fill} collapsable={false}>
        <MainHome />
      </View>
      <View key="smart-pick" style={styles.fill} collapsable={false}>
        <View className="flex-1 bg-page dark:bg-gray-900">
          <SmartPickTab />
        </View>
      </View>
      <View key="saved" style={styles.fill} collapsable={false}>
        <MainSaved />
      </View>
      <View key="search" style={styles.fill} collapsable={false}>
        <MainSearch />
      </View>
    </PagerView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
