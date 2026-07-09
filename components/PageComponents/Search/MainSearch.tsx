import { Pressable, Text, View } from "react-native";
import { Slot, usePathname, useRouter, type Href } from "expo-router";
import { List, MapPin, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { SearchFilterHeader } from "@/components/PageComponents/Search/SearchFilterHeader";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import type { Location as GeoLocation } from "@/http/list-api/types";

interface SearchTabItem extends TabItem {
  href: Href;
}

function getActiveTab(pathname: string): string {
  if (pathname.includes("/businesses")) return "places";
  if (pathname.includes("/people")) return "people";
  return "lists";
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
  const activeTab = getActiveTab(pathname);

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

  const { counts } = useUnifiedSearch();
  const { cityLabel: detectedCityLabel } = useHomeLocationLabel();

  const tabs: SearchTabItem[] = [
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
  ];

  const cityLabel =
    locationMode === "all"
      ? t("home.location.all")
      : locationMode === "city" && manualLocation
        ? formatCityLabel(manualLocation)
        : detectedCityLabel || t("home.unknownLocation");

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((item) => item.id === tabId);
    if (tab && tab.id !== activeTab) {
      router.replace(tab.href);
    }
  };

  const handleCitySelected = (location: GeoLocation) => {
    setManualLocation(location);
    setLocationMode("city");
  };

  const handleAllSelected = () => {
    setManualLocation(null);
    setLocationMode("all");
  };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        borderless
        rightChild={
          <Pressable
            onPress={() => commitQuery()}
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

      <View className="gap-3">
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
          matchingCount={counts.lists}
          selectedVibes={selectedVibes}
          onVibesChange={setSelectedVibes}
          vibeMatchCount={counts.lists}
          showMatchFilter={activeTab !== "places"}
          showVibeFilter={activeTab === "lists"}
        />

      </View>

      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
