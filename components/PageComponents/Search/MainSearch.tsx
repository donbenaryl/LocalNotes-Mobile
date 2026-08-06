import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { List, MapPin, Sparkles, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  SectionPager,
  type SectionPagerPage,
} from "@/components/ui/SectionPager";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { SearchFilterHeader } from "@/components/PageComponents/Search/SearchFilterHeader";
import { SearchPicks } from "@/components/PageComponents/Search/SearchPicks/SearchPicks";
import { SearchLists } from "@/components/PageComponents/Search/SearchLists/SearchLists";
import { SearchBusinesses } from "@/components/PageComponents/Search/SearchBusinesses/SearchBusinesses";
import { SearchPeople } from "@/components/PageComponents/Search/SearchPeople/SearchPeople";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import { HOME_HREF } from "@/constants/swipeNavigation";
import type { Location as GeoLocation } from "@/http/list-api/types";

interface SearchTabItem extends TabItem {
  href: Href;
}

const SAVED_SHARED = "/(app)/(tabs)/saved/shared-with-me" as const;

function getActiveTab(pathname: string): string {
  if (pathname.includes("/businesses")) return "places";
  if (pathname.includes("/people")) return "people";
  if (pathname.includes("/lists")) return "lists";
  return "picks";
}

function formatCityLabel(location: GeoLocation): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

export default function MainSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  // Local state, not the router — see MainHome for why navigating per tab
  // produces a second slide-in on top of the pager's own animation.
  const [activeTab, setActiveTab] = useState(() => getActiveTab(pathname));

  useEffect(() => {
    if (!pathname.includes("/search")) return;
    setActiveTab(getActiveTab(pathname));
  }, [pathname]);

  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const commitQuery = useSearchStore((s) => s.commitQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const setMatchThreshold = useSearchStore((s) => s.setMatchThreshold);
  const selectedVibes = useSearchStore((s) => s.selectedVibes);
  const setSelectedVibes = useSearchStore((s) => s.setSelectedVibes);
  const locationMode = useSearchStore((s) => s.locationMode);
  const setLocationMode = useSearchStore((s) => s.setLocationMode);
  const manualLocation = useSearchStore((s) => s.manualLocation);
  const setManualLocation = useSearchStore((s) => s.setManualLocation);
  const setFilterHeaderBottom = useSearchChromeStore(
    (s) => s.setFilterHeaderBottom,
  );
  const activeResultCount = useSearchChromeStore((s) => s.activeResultCount);
  const returnTo = useSearchChromeStore((s) => s.returnTo);
  const setReturnTo = useSearchChromeStore((s) => s.setReturnTo);

  const { cityLabel: detectedCityLabel } = useHomeLocationLabel();

  const tabs: SearchTabItem[] = useMemo(
    () => [
      {
        id: "picks",
        label: t("search.tabs.picks"),
        icon: Sparkles,
        href: "/(app)/(stack)/search/picks",
      },
      {
        id: "lists",
        label: t("search.tabs.lists"),
        icon: List,
        href: "/(app)/(stack)/search/lists",
      },
      {
        id: "places",
        label: t("search.tabs.places"),
        icon: MapPin,
        href: "/(app)/(stack)/search/businesses",
      },
      {
        id: "people",
        label: t("search.tabs.people"),
        icon: Users,
        href: "/(app)/(stack)/search/people",
      },
    ],
    [t],
  );

  const pages: SectionPagerPage[] = useMemo(
    () => [
      { id: "picks", href: tabs[0].href, render: () => <SearchPicks /> },
      { id: "lists", href: tabs[1].href, render: () => <SearchLists /> },
      { id: "places", href: tabs[2].href, render: () => <SearchBusinesses /> },
      { id: "people", href: tabs[3].href, render: () => <SearchPeople /> },
    ],
    [tabs],
  );

  const cityLabel =
    locationMode === "all"
      ? t("home.location.all")
      : locationMode === "city" && manualLocation
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

  const handleBack = useCallback(() => {
    const destination = returnTo ?? HOME_HREF;
    setReturnTo(null);
    router.replace(destination);
  }, [returnTo, router, setReturnTo]);

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        borderless
        onBack={handleBack}
        rightChild={
          <Pressable
            onPress={() => commitQuery(query)}
            accessibilityRole="button"
            accessibilityLabel={t("common.search")}
            className="cursor-pointer py-2"
          >
            <Text className="font-geist-semibold text-sm text-brand">
              {t("common.search")}
            </Text>
          </Pressable>
        }
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onCommit={commitQuery}
        />
      </PageHeader>

      <View className="gap-3 px-4">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        <SearchFilterHeader
          className="-mt-2 mb-3 absolute top-10 z-20"
          onMeasuredBottomChange={setFilterHeaderBottom}
          cityLabel={cityLabel}
          isAllLocations={locationMode === "all"}
          onCitySelected={handleCitySelected}
          onAllSelected={handleAllSelected}
          matchThreshold={matchThreshold}
          onMatchThresholdChange={setMatchThreshold}
          matchingCount={activeResultCount}
          selectedVibes={selectedVibes}
          onVibesChange={setSelectedVibes}
          vibeMatchCount={activeResultCount}
          showMatchFilter={activeTab !== "places"}
          showVibeFilter={activeTab === "lists" || activeTab === "picks"}
        />
      </View>

      <View className="flex-1">
        <SectionPager
          pages={pages}
          activeId={activeTab}
          onActiveIdChange={handleTabChange}
          edgeLeftHref={HOME_HREF}
          edgeRightHref={SAVED_SHARED}
        />
      </View>
    </View>
  );
}
