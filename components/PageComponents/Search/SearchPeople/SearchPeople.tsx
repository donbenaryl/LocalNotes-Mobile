import { useTranslation } from "react-i18next";
import { PeopleCard } from "@/components/PageComponents/People/PeopleCard";
import { SearchResultsLayout } from "@/components/PageComponents/Search/SearchResultsLayout";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useSearchStore } from "@/stores/useSearchStore";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";

function formatCityLabel(location: {
  city: string;
  region?: string;
}): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

/**
 * People tab still pins list locations on the map (same as web MapPanel),
 * because people results don't always carry home-city coordinates.
 */
export function SearchPeople() {
  const { t } = useTranslation();
  const { people, lists, isLoading, isPending, error, refetch } =
    useUnifiedSearch();
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
    <SearchResultsLayout<UnifiedSearchPersonDAO>
      mode="lists"
      resultsKind="people"
      listsForMap={lists}
      areaLabel={areaLabel}
      data={people}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <PeopleCard data={item} />}
      isLoading={isLoading}
      isPending={isPending}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      emptyTitle={t("search.empty.people")}
    />
  );
}
