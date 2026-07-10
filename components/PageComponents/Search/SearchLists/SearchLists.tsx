import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { SearchResultsLayout } from "@/components/PageComponents/Search/SearchResultsLayout";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useSearchStore } from "@/stores/useSearchStore";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import { useTranslation } from "react-i18next";
import type { ListItemDAO } from "@/http/list-api/types";

function formatCityLabel(location: {
  city: string;
  region?: string;
}): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

export function SearchLists() {
  const { t } = useTranslation();
  const { lists, isLoading, isPending, error, refetch } = useUnifiedSearch();
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
    <SearchResultsLayout<ListItemDAO>
      mode="lists"
      resultsKind="lists"
      listsForMap={lists}
      areaLabel={areaLabel}
      data={lists}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <ListCardDetailed list={item} />}
      isLoading={isLoading}
      isPending={isPending}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      emptyTitle={t("search.empty.lists")}
    />
  );
}
