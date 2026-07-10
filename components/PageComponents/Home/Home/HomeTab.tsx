import { useMemo, useState, type ReactNode } from "react";
import {
  RefreshControl,
  Text,
  View,
} from "react-native";
import { HomeChromeScrollView } from "@/components/ui/HomeChromeScrollView";
import { useTranslation } from "react-i18next";
import type { ListItemDAO, ListItemPublic, Location as GeoLocation } from "@/http/list-api/types";
import { resolveImageUrl } from "@/utils/httpHelpers";
import {
  HomeFilterHeader,
  type HomeContentType,
  type HomeListFilter,
} from "@/components/PageComponents/Home/Home/HomeFilterHeader";
import { HomeEditorialHeader } from "@/components/PageComponents/Home/Home/HomeEditorialHeader";
import { ForYouSection } from "@/components/PageComponents/Home/Home/ForYouSection";
import { HomeTabSkeleton } from "@/components/PageComponents/Home/Home/HomeTabSkeleton";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { PageSectionTitle } from "@/components/ui/PageSectionTitle";
import { PickCard } from "@/components/PageComponents/Profile/PickCard";
import { useHomeLists } from "@/hooks/useHomeLists";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import { sortPicksWithImagesFirst } from "@/utils/homePicks";
import {
  getTimeOfDayLabel,
  type TimeOfDayPeriod,
} from "@/utils/time";
import { cn } from "@/utils/cn";

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
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("mb-6", className)}>
      <Text className="mb-3 font-geist-bold text-lg text-ink dark:text-gray-100">
        {title}
      </Text>
      <View className="gap-4">{children}</View>
    </View>
  );
}

function HomePicksGrid({
  picks,
  onRefresh,
}: {
  picks: ListItemPublic[];
  onRefresh: () => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-4">
      {picks.map((pick) => (
        <View key={pick.id} className="w-[48%]">
          <PickCard
            data={pick}
            variant="grid"
            readOnly
            onRefresh={onRefresh}
          />
        </View>
      ))}
    </View>
  );
}

type HomeLocationMode = "auto" | "city" | "all";

export function HomeTab() {
  const { t, i18n } = useTranslation();
  const [contentType, setContentType] = useState<HomeContentType>("lists");
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
    forYouPicks,
    nearYouPicks,
    discoverPicks,
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
    contentType,
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

  const sortedForYouPicks = useMemo(
    () => sortPicksWithImagesFirst(forYouPicks),
    [forYouPicks],
  );

  const sortedNearYouPicks = useMemo(
    () => sortPicksWithImagesFirst(nearYouPicks),
    [nearYouPicks],
  );

  const sortedDiscoverPicks = useMemo(
    () => sortPicksWithImagesFirst(discoverPicks),
    [discoverPicks],
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
    contentType === "picks"
      ? forYouPicks.length === 0 &&
        !showNearYouSection &&
        discoverPicks.length === 0
      : forYouLists.length === 0 &&
        !showNearYouSection &&
        discoverLists.length === 0;

  return (
    <HomeChromeScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
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
            contentType={contentType}
            onContentTypeChange={setContentType}
          />

          <HomeEditorialHeader
            cityLabel={cityLabel}
            isAllLocations={locationMode === "all"}
            isCityLoading={isLocationLoading}
          />

          {contentType === "lists" ? (
            <>
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
            </>
          ) : (
            <>
              {sortedForYouPicks.length > 0 ? (
                <View className="mb-6">
                  <View className="mb-2.5 flex-row items-baseline justify-between">
                    <PageSectionTitle>{t("home.forYou.eyebrow")}</PageSectionTitle>
                    {topMatchPercent != null ? (
                      <Text className="font-geist-bold text-xs text-brand">
                        {t("home.forYou.match", { percent: topMatchPercent })}
                      </Text>
                    ) : null}
                  </View>
                  <HomePicksGrid
                    picks={sortedForYouPicks}
                    onRefresh={() => void refetch()}
                  />
                </View>
              ) : null}

              {showNearYouSection ? (
                <HomeSection title={t("home.newNearYou")}>
                  <HomePicksGrid
                    picks={sortedNearYouPicks}
                    onRefresh={() => void refetch()}
                  />
                </HomeSection>
              ) : null}

              {sortedDiscoverPicks.length > 0 ? (
                <HomeSection title={t("home.discover")}>
                  <HomePicksGrid
                    picks={sortedDiscoverPicks}
                    onRefresh={() => void refetch()}
                  />
                </HomeSection>
              ) : null}
            </>
          )}

          {isEmpty ? (
            <EmptyScreen
              title={
                contentType === "picks"
                  ? t("home.emptyPicksDiscover")
                  : t("home.emptyDiscover")
              }
              description={
                contentType === "picks"
                  ? t("home.emptyPicksDiscoverDescription")
                  : t("home.emptyDiscoverDescription")
              }
              className="justify-center py-20"
            />
          ) : null}
        </>
      )}
    </HomeChromeScrollView>
  );
}
