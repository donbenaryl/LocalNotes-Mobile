import { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { PicksMasonryGrid } from "@/components/ui/PicksMasonryGrid";
import { PeopleCard } from "@/components/PageComponents/People/PeopleCard";
import { SearchResultsLayout } from "@/components/PageComponents/Search/SearchResultsLayout";
import { usePicksSearch } from "@/hooks/usePicksSearch";
import { useListSearch } from "@/hooks/useListSearch";
import { usePeopleSearch } from "@/hooks/usePeopleSearch";
import { useSearchStore } from "@/stores/useSearchStore";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";

const PREVIEW_LIMIT = 5;

type SearchAllTabId = "picks" | "lists" | "people";

interface SearchAllProps {
  onSeeAll: (tabId: SearchAllTabId) => void;
}

function formatCityLabel(location: {
  city: string;
  region?: string;
}): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

function SectionHeader({
  title,
  totalCount,
  onSeeAll,
}: {
  title: string;
  totalCount: number;
  onSeeAll?: () => void;
}) {
  const { t } = useTranslation();
  const showSeeAll = totalCount > PREVIEW_LIMIT && onSeeAll != null;

  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="font-geist-semibold text-base text-ink dark:text-dk-text">
        {title}
      </Text>
      {showSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={t("search.seeAll", { count: totalCount })}
          hitSlop={8}
          className="active:opacity-70"
        >
          <Text className="font-geist-bold text-sm text-ink underline dark:text-dk-text">
            {t("search.seeAll", { count: totalCount })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SearchAll({ onSeeAll }: SearchAllProps) {
  const { t } = useTranslation();
  const picksSearch = usePicksSearch();
  const listsSearch = useListSearch();
  const peopleSearch = usePeopleSearch();

  const locationMode = useSearchStore((s) => s.locationMode);
  const manualLocation = useSearchStore((s) => s.manualLocation);
  const { cityLabel: detectedCityLabel } = useHomeLocationLabel();

  const areaLabel =
    locationMode === "all"
      ? undefined
      : locationMode === "city" && manualLocation
        ? formatCityLabel(manualLocation)
        : detectedCityLabel || undefined;

  const previewPicks = useMemo(
    () => picksSearch.picks.slice(0, PREVIEW_LIMIT),
    [picksSearch.picks],
  );
  const previewLists = useMemo(
    () => listsSearch.lists.slice(0, PREVIEW_LIMIT),
    [listsSearch.lists],
  );
  const previewPeople = useMemo(
    () => peopleSearch.people.slice(0, PREVIEW_LIMIT),
    [peopleSearch.people],
  );

  const totalCount =
    picksSearch.totalCount + listsSearch.totalCount + peopleSearch.totalCount;

  const isPending =
    (picksSearch.isPending || listsSearch.isPending || peopleSearch.isPending) &&
    picksSearch.picks.length === 0 &&
    listsSearch.lists.length === 0 &&
    peopleSearch.people.length === 0;

  const isRefetching =
    picksSearch.isRefetching ||
    listsSearch.isRefetching ||
    peopleSearch.isRefetching;

  const error =
    picksSearch.error && listsSearch.error && peopleSearch.error
      ? picksSearch.error
      : null;

  const hasAnyResults =
    picksSearch.picks.length > 0 ||
    listsSearch.lists.length > 0 ||
    peopleSearch.people.length > 0;

  const handleRetry = () => {
    void picksSearch.refetch();
    void listsSearch.refetch();
    void peopleSearch.refetch();
  };

  // Dummy data array so SearchResultsLayout treats the sheet as non-empty when
  // any section has results (body is fully custom via renderBody).
  const layoutData = hasAnyResults ? [true] : [];

  return (
    <SearchResultsLayout<boolean>
      mode="all"
      resultsKind="all"
      picksForMap={picksSearch.picks}
      listsForMap={listsSearch.lists}
      peopleForMap={peopleSearch.people}
      areaLabel={areaLabel}
      data={layoutData}
      keyExtractor={() => "all"}
      totalCount={totalCount}
      isLoading={false}
      isPending={isPending}
      isRefetching={isRefetching}
      error={error}
      onRetry={handleRetry}
      emptyTitle={t("search.empty.all")}
      renderBody={(_data, { listFooter }) =>
        !hasAnyResults ? (
          <EmptyScreen
            title={t("search.empty.all")}
            description={t("search.empty.description")}
          />
        ) : (
          <ScrollView
            style={styles.fill}
            contentContainerClassName="gap-6 px-4 pb-28"
            showsVerticalScrollIndicator={false}
            refreshControl={
              Platform.OS === "android" ? undefined : (
                <AppRefreshControl
                  refreshing={isRefetching}
                  onRefresh={handleRetry}
                />
              )
            }
          >
            {previewPicks.length > 0 ? (
              <View>
                <SectionHeader
                  title={t("search.tabs.picks")}
                  totalCount={picksSearch.totalCount}
                  onSeeAll={() => onSeeAll("picks")}
                />
                <PicksMasonryGrid
                  picks={previewPicks}
                  onRefresh={() => void picksSearch.refetch()}
                />
              </View>
            ) : null}

            {previewLists.length > 0 ? (
              <View className="gap-3">
                <SectionHeader
                  title={t("search.tabs.lists")}
                  totalCount={listsSearch.totalCount}
                  onSeeAll={() => onSeeAll("lists")}
                />
                {previewLists.map((list) => (
                  <ListCardDetailed key={list.id} list={list} />
                ))}
              </View>
            ) : null}

            {previewPeople.length > 0 ? (
              <View className="gap-3">
                <SectionHeader
                  title={t("search.tabs.people")}
                  totalCount={peopleSearch.totalCount}
                  onSeeAll={() => onSeeAll("people")}
                />
                {previewPeople.map((person) => (
                  <PeopleCard key={person.id} data={person} />
                ))}
              </View>
            ) : null}

            {listFooter ? <View>{listFooter}</View> : null}
          </ScrollView>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
});
