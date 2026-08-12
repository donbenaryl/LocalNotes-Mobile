import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { PicksMasonryGrid } from "@/components/ui/PicksMasonryGrid";
import { SearchResultsLayout } from "@/components/PageComponents/Search/SearchResultsLayout";
import { usePicksSearch } from "@/hooks/usePicksSearch";
import { useSearchStore } from "@/stores/useSearchStore";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import type { ListItemPublic } from "@/http/list-api/types";

function formatCityLabel(location: {
  city: string;
  region?: string;
}): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

export function SearchPicks() {
  const { t } = useTranslation();
  const { picks, isLoading, isPending, isRefetching, error, refetch } =
    usePicksSearch();
  const locationMode = useSearchStore((s) => s.locationMode);
  const manualLocation = useSearchStore((s) => s.manualLocation);
  const { cityLabel: detectedCityLabel } = useHomeLocationLabel();

  const areaLabel =
    locationMode === "all"
      ? undefined
      : locationMode === "city" && manualLocation
        ? formatCityLabel(manualLocation)
        : detectedCityLabel || undefined;

  return (
    <SearchResultsLayout<ListItemPublic>
      mode="lists"
      resultsKind="picks"
      picksForMap={picks}
      areaLabel={areaLabel}
      data={picks}
      keyExtractor={(item) => item.id}
      renderBody={(data) =>
        data.length === 0 ? (
          <EmptyScreen
            title={t("search.empty.picks")}
            description={t("search.empty.description")}
          />
        ) : (
          <ScrollView
            contentContainerClassName="px-4 pb-28"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <AppRefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
              />
            }
          >
            <PicksMasonryGrid picks={data} onRefresh={() => void refetch()} />
          </ScrollView>
        )
      }
      isLoading={isLoading}
      isPending={isPending}
      isRefetching={isRefetching}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      emptyTitle={t("search.empty.picks")}
    />
  );
}
