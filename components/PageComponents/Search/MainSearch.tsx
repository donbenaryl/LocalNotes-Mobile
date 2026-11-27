import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { Building2, LayoutGrid, List, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  SectionPager,
  type SectionPagerPage,
} from "@/components/ui/SectionPager";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { SearchFilterHeader } from "@/components/PageComponents/Search/SearchFilterHeader";
import { SearchFocusDropdown } from "@/components/PageComponents/Search/SearchFocusDropdown";
import { SearchAll } from "@/components/PageComponents/Search/SearchAll/SearchAll";
import { SearchPicks } from "@/components/PageComponents/Search/SearchPicks/SearchPicks";
import { SearchLists } from "@/components/PageComponents/Search/SearchLists/SearchLists";
import { SearchPeople } from "@/components/PageComponents/Search/SearchPeople/SearchPeople";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";
import { resolveSectionTabFromPathname } from "@/utils/sectionTabSync";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import { useInitializeSearchLocation } from "@/hooks/useInitializeSearchLocation";
import { useSearchFocusSuggestions } from "@/hooks/useSearchFocusSuggestions";
import { HOME_HREF } from "@/constants/swipeNavigation";
import { recordVibeUsage } from "@/utils/searchRecents";
import type { Location as GeoLocation } from "@/http/list-api/types";
import type { MatchPriorities } from "@/components/ui/MatchThreshhold";

interface SearchTabItem extends TabItem {
  href: Href;
}

function getActiveTab(pathname: string): string {
  if (pathname.includes("/people")) return "people";
  if (pathname.includes("/lists")) return "lists";
  if (pathname.includes("/picks")) return "picks";
  return "all";
}

function formatCityLabel(location: GeoLocation): string {
  if (location.street_address?.trim()) {
    return location.street_address.trim();
  }
  if (location.region?.trim() && location.city?.trim()) {
    return `${location.city.trim()}, ${location.region.trim()}`;
  }
  return location.city?.trim() || location.region?.trim() || "";
}

export default function MainSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { isInitializing: isLocationInitializing } =
    useInitializeSearchLocation();
  // Local state, not the router — see MainHome for why navigating per tab
  // produces a second slide-in on top of the pager's own animation.
  const [activeTab, setActiveTab] = useState(() => getActiveTab(pathname));

  useEffect(() => {
    const lastHref = useSectionRouteStore.getState().lastHrefBySection.search;
    setActiveTab((current) => {
      const tab = resolveSectionTabFromPathname({
        pathname,
        sectionSegment: "/search",
        defaultTabId: "all",
        getActiveTabFromPathname: getActiveTab,
        lastHref,
        currentActiveTab: current,
      });
      return tab ?? current;
    });
  }, [pathname]);

  // Re-tapping the active footer tab resets to the first sub-tab — see MainHome.
  const resetToken = useSectionRouteStore(
    (s) => s.sectionResetTokens.search ?? 0,
  );
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setActiveTab("all");
  }, [resetToken]);

  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const commitQuery = useSearchStore((s) => s.commitQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const setMatchThreshold = useSearchStore((s) => s.setMatchThreshold);
  const matchPriorities = useSearchStore((s) => s.matchPriorities);
  const setMatchPriorities = useSearchStore((s) => s.setMatchPriorities);
  const selectedVibes = useSearchStore((s) => s.selectedVibes);
  const setSelectedVibes = useSearchStore((s) => s.setSelectedVibes);
  const locationMode = useSearchStore((s) => s.locationMode);
  const setLocationMode = useSearchStore((s) => s.setLocationMode);
  const manualLocation = useSearchStore((s) => s.manualLocation);
  const setManualLocation = useSearchStore((s) => s.setManualLocation);
  const setFilterHeaderBottom = useSearchChromeStore(
    (s) => s.setFilterHeaderBottom,
  );
  const resultCounts = useSearchChromeStore((s) => s.resultCounts);
  const returnTo = useSearchChromeStore((s) => s.returnTo);
  const setReturnTo = useSearchChromeStore((s) => s.setReturnTo);

  const allResultCount =
    resultCounts.picks + resultCounts.lists + resultCounts.people;
  const activeResultCount =
    activeTab === "all"
      ? allResultCount
      : activeTab === "picks"
        ? resultCounts.picks
        : activeTab === "lists"
          ? resultCounts.lists
          : resultCounts.people;

  const { cityLabel: detectedCityLabel } = useHomeLocationLabel();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    recentQueries,
    suggestions,
    followingPicks,
    rememberQuery,
    removeQuery,
    clearQueries,
    refreshLocal,
  } = useSearchFocusSuggestions();

  const dismissFocusDropdown = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsSearchFocused(false);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsSearchFocused(true);
    void refreshLocal();
  }, [refreshLocal]);

  const handleSearchBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsSearchFocused(false);
      blurTimeoutRef.current = null;
    }, 180);
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      setQuery(text);
      setIsSearchFocused(true);
    },
    [setQuery],
  );

  const handleCommitQuery = useCallback(
    (next?: string) => {
      Keyboard.dismiss();
      const value = typeof next === "string" ? next : query;
      commitQuery(value);
      if (value.trim()) {
        void rememberQuery(value);
        dismissFocusDropdown();
      }
    },
    [commitQuery, dismissFocusDropdown, query, rememberQuery],
  );

  const handleSelectSuggestion = useCallback(
    (label: string) => {
      Keyboard.dismiss();
      setQuery(label);
      commitQuery(label);
      void rememberQuery(label);
      dismissFocusDropdown();
    },
    [commitQuery, dismissFocusDropdown, rememberQuery, setQuery],
  );

  const handleSelectFollowPick = useCallback(() => {
    dismissFocusDropdown();
  }, [dismissFocusDropdown]);

  const handleVibesChange = useCallback(
    (vibes: string[]) => {
      setSelectedVibes(vibes);
      void recordVibeUsage(vibes);
    },
    [setSelectedVibes],
  );

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const tabs: SearchTabItem[] = useMemo(
    () => [
      {
        id: "all",
        label: t("search.tabs.all"),
        stat: allResultCount,
        icon: LayoutGrid,
        href: "/(app)/(tabs)/search/all",
      },
      {
        id: "picks",
        label: t("search.tabs.picks"),
        stat: resultCounts.picks,
        icon: Building2,
        href: "/(app)/(tabs)/search/picks",
      },
      {
        id: "lists",
        label: t("search.tabs.lists"),
        stat: resultCounts.lists,
        icon: List,
        href: "/(app)/(tabs)/search/lists",
      },
      {
        id: "people",
        label: t("search.tabs.people"),
        stat: resultCounts.people,
        icon: Users,
        href: "/(app)/(tabs)/search/people",
      },
    ],
    [t, allResultCount, resultCounts.picks, resultCounts.lists, resultCounts.people],
  );

  const handleSeeAll = useCallback((tabId: "picks" | "lists" | "people") => {
    setActiveTab(tabId);
  }, []);

  const pages: SectionPagerPage[] = useMemo(
    () => [
      {
        id: "all",
        href: tabs[0].href,
        render: () => <SearchAll onSeeAll={handleSeeAll} />,
      },
      { id: "picks", href: tabs[1].href, render: () => <SearchPicks /> },
      { id: "lists", href: tabs[2].href, render: () => <SearchLists /> },
      { id: "people", href: tabs[3].href, render: () => <SearchPeople /> },
    ],
    [tabs, handleSeeAll],
  );

  // Stay on "all" / choose-location until default resolves so we don't flash "Unknown".
  const effectiveLocationMode =
    isLocationInitializing ? "all" : locationMode;

  const cityLabel =
    effectiveLocationMode === "all"
      ? t("home.location.all")
      : effectiveLocationMode === "city" && manualLocation
        ? formatCityLabel(manualLocation)
        : detectedCityLabel || t("home.unknownLocation");

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const handleCitySelected = (location: GeoLocation) => {
    setManualLocation(location);
    setLocationMode("city");
  };

  const handleAllSelected = () => {
    setManualLocation(null);
    setLocationMode("all");
  };

  const handleMatchApply = (
    threshold: number | null,
    priorities: MatchPriorities
  ) => {
    setMatchThreshold(threshold);
    setMatchPriorities(priorities);
  };

  const handleBack = useCallback(() => {
    const destination = returnTo ?? HOME_HREF;
    setReturnTo(null);
    router.navigate(destination);
  }, [returnTo, router, setReturnTo]);

  return (
    <View className="bg-page dark:bg-dk-page" style={{ flex: 1 }}>
      <SectionPager
        sectionId="search"
        chrome={
          <>
            <View className="relative z-30">
              <PageHeader
                borderless
                includeSafeArea={false}
                onBack={handleBack}
                rightChild={
                  <Pressable
                    onPress={() => {
                      handleCommitQuery(query);
                      dismissFocusDropdown();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.search")}
                    className="cursor-pointer py-2"
                  >
                    <Text className="font-geist-semibold text-sm text-brand dark:text-dk-text">
                      {t("common.search")}
                    </Text>
                  </Pressable>
                }
              >
                <SearchBar
                  value={query}
                  onChangeText={handleQueryChange}
                  onCommit={handleCommitQuery}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
              </PageHeader>

              <SearchFocusDropdown
                visible={isSearchFocused}
                recentQueries={recentQueries}
                suggestions={suggestions}
                followingPicks={followingPicks}
                onSelect={handleSelectSuggestion}
                onRemoveRecent={(q) => {
                  void removeQuery(q);
                }}
                onClearRecent={() => {
                  void clearQueries();
                }}
                onSelectFollowPick={handleSelectFollowPick}
                onDismiss={dismissFocusDropdown}
              />
            </View>

            <View className="gap-3 px-4">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
              <SearchFilterHeader
                className="-mt-2 mb-3 absolute left-0 right-0 top-10 z-20"
                onMeasuredBottomChange={setFilterHeaderBottom}
                cityLabel={cityLabel}
                isAllLocations={effectiveLocationMode === "all"}
                onCitySelected={handleCitySelected}
                onAllSelected={handleAllSelected}
                matchThreshold={matchThreshold}
                matchPriorities={matchPriorities}
                onMatchApply={handleMatchApply}
                matchingCount={activeResultCount}
                selectedVibes={selectedVibes}
                onVibesChange={handleVibesChange}
                vibeMatchCount={activeResultCount}
                histogramSurface={
                  activeTab === "people"
                    ? "people"
                    : activeTab === "lists"
                      ? "lists"
                      : "picks"
                }
                showVibeFilter={
                  activeTab === "all" ||
                  activeTab === "lists" ||
                  activeTab === "picks"
                }
              />
            </View>
          </>
        }
        pages={pages}
        activeId={activeTab}
        onActiveIdChange={handleTabChange}
      />
    </View>
  );
}
