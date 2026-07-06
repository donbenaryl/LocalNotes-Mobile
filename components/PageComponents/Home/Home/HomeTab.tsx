import { useMemo, useState, type ReactNode } from "react";
import {
  RefreshControl,
  Text,
  View,
} from "react-native";
import { HomeChromeScrollView } from "@/components/ui/HomeChromeScrollView";
import { useTranslation } from "react-i18next";
import type { ListItemDAO, Location as GeoLocation } from "@/http/list-api/types";
import { resolveImageUrl } from "@/utils/httpHelpers";
import {
  HomeFilterHeader,
  type HomeListFilter,
} from "@/components/PageComponents/Home/Home/HomeFilterHeader";
import { HomeEditorialHeader } from "@/components/PageComponents/Home/Home/HomeEditorialHeader";
import { ForYouSection } from "@/components/PageComponents/Home/Home/ForYouSection";
import { HomeTabSkeleton } from "@/components/PageComponents/Home/Home/HomeTabSkeleton";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { useHomeLists } from "@/hooks/useHomeLists";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import {
  getTimeOfDayLabel,
  type TimeOfDayPeriod,
} from "@/utils/time";

function formatCityLabel(location: GeoLocation): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

function listHasHeroImage(list: ListItemDAO): boolean {
  if (resolveImageUrl(list.image_url)) return true;

  for (const item of list.items ?? []) {
    if (
      resolveImageUrl(item.images?.[0]?.url) ??
      resolveImageUrl(item.business?.logo)
    ) {
      return true;
    }
  }

  return false;
}

function sortListsWithImagesFirst(lists: ListItemDAO[]): ListItemDAO[] {
  return [...lists]
    .map((list, originalIndex) => ({ list, originalIndex }))
    .sort((a, b) => {
      const aHasImage = listHasHeroImage(a.list);
      const bHasImage = listHasHeroImage(b.list);
      if (aHasImage === bHasImage) return a.originalIndex - b.originalIndex;
      return aHasImage ? -1 : 1;
    })
    .map(({ list }) => list);
}

function HomeSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-3 font-geist-bold text-lg text-ink dark:text-gray-100">
        {title}
      </Text>
      <View className="gap-4">{children}</View>
    </View>
  );
}

type HomeLocationMode = "auto" | "city" | "all";

export function HomeTab() {
  const { t, i18n } = useTranslation();
  const [activeFilters, setActiveFilters] = useState<HomeListFilter[]>([]);
  const [matchThreshold, setMatchThreshold] = useState<number | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [locationMode, setLocationMode] = useState<HomeLocationMode>("all");
  const [manualLocation, setManualLocation] = useState<GeoLocation | null>(null);

  const handleFilterChange = (filter: HomeListFilter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleMatchThresholdChange = (threshold: number | null) => {
    setMatchThreshold(threshold);
    setActiveFilters((prev) =>
      threshold !== null
        ? prev.includes("personality_match") ? prev : [...prev, "personality_match"]
        : prev.filter((f) => f !== "personality_match")
    );
  };

  const handleVibesChange = (vibes: string[]) => {
    setSelectedVibes(vibes);
    setActiveFilters((prev) => {
      const withoutVibe = prev.filter((f) => f !== "vibe");
      return vibes.length > 0 ? [...withoutVibe, "vibe"] : withoutVibe;
    });
  };

  const { cityLabel: detectedCityLabel, isLoading: isLocationLoading } = useHomeLocationLabel();
  const cityLabel =
    locationMode === "all"
      ? t("home.location.all")
      : locationMode === "city" && manualLocation
        ? formatCityLabel(manualLocation)
        : detectedCityLabel;

  const handleCitySelected = (location: GeoLocation) => {
    setLocationMode("city");
    setManualLocation(location);
  };

  const handleAllSelected = () => {
    setLocationMode("all");
    setManualLocation(null);
  };

  const {
    nearYouLists,
    forYouLists,
    topMatchPercent,
    discoverLists,
    isLoading,
    error,
    refetch,
    showNearYouSection,
    matchingCount,
    vibeMatchCount,
  } = useHomeLists({
    activeFilters,
    matchThreshold,
    locationOverride: locationMode === "city" ? manualLocation : null,
    skipLocationFilter: locationMode === "all",
    selectedVibes,
  });

  const timeLabel = useMemo(
    () =>
      getTimeOfDayLabel(
        (period: TimeOfDayPeriod) => t(`home.timeOfDay.${period}`),
        new Date(),
        i18n.language,
      ),
    [t, i18n.language],
  );

  const sortedForYouLists = useMemo(
    () => sortListsWithImagesFirst(forYouLists),
    [forYouLists],
  );

  const sortedNearYouLists = useMemo(
    () => sortListsWithImagesFirst(nearYouLists),
    [nearYouLists],
  );

  const sortedDiscoverLists = useMemo(
    () => sortListsWithImagesFirst(discoverLists),
    [discoverLists],
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-4 text-center font-geist text-base text-gray-600 dark:text-gray-400">
          {t("home.error")}
        </Text>
        <LocalNotesButton
          label={t("home.retry")}
          onPress={() => void refetch()}
          variant="dark"
          isRounded
        />
      </View>
    );
  }

  const isEmpty =
    forYouLists.length === 0 &&
    !showNearYouSection &&
    discoverLists.length === 0;

  return (
    <HomeChromeScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28 pt-4"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => void refetch()}
          tintColor="#FF6B1A"
        />
      }
    >
      {isLoading ? (
        <HomeTabSkeleton />
      ) : (
        <>
          <HomeFilterHeader
            cityLabel={cityLabel}
            timeLabel={timeLabel}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onCitySelected={handleCitySelected}
            onAllSelected={handleAllSelected}
            isAllLocations={locationMode === "all"}
            isCityLoading={isLocationLoading}
            matchThreshold={matchThreshold}
            onMatchThresholdChange={handleMatchThresholdChange}
            matchingCount={matchingCount}
            selectedVibes={selectedVibes}
            onVibesChange={handleVibesChange}
            vibeMatchCount={vibeMatchCount}
          />

          <HomeEditorialHeader
            cityLabel={cityLabel}
            isAllLocations={locationMode === "all"}
            isCityLoading={isLocationLoading}
          />

          <ForYouSection
            lists={sortedForYouLists}
            topMatchPercent={topMatchPercent}
          />

          {showNearYouSection ? (
            <HomeSection title={t("home.newNearYou")}>
              {sortedNearYouLists.map((list) => (
                <ListCardDetailed key={list.id} list={list} />
              ))}
            </HomeSection>
          ) : null}

          {sortedDiscoverLists.length > 0 ? (
            <HomeSection title={t("home.discover")}>
              {sortedDiscoverLists.map((list) => (
                <ListCardDetailed key={list.id} list={list} />
              ))}
            </HomeSection>
          ) : null}

          {isEmpty ? (
            <EmptyScreen
              title={t("home.emptyDiscover")}
              description={t("home.emptyDiscoverDescription")}
              className="justify-center py-20"
            />
          ) : null}
        </>
      )}
    </HomeChromeScrollView>
  );
}
