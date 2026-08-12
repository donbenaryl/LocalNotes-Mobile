import { useTranslation } from "react-i18next";
import { PeopleCard } from "@/components/PageComponents/People/PeopleCard";
import { SearchResultsLayout } from "@/components/PageComponents/Search/SearchResultsLayout";
import { usePeopleSearch } from "@/hooks/usePeopleSearch";
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

export function SearchPeople() {
  const { t } = useTranslation();
  const { people, isLoading, isPending, isRefetching, error, refetch } =
    usePeopleSearch();
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
      mode="people"
      resultsKind="people"
      peopleForMap={people}
      areaLabel={areaLabel}
      data={people}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <PeopleCard data={item} />}
      isLoading={isLoading}
      isPending={isPending}
      isRefetching={isRefetching}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      emptyTitle={t("search.empty.people")}
    />
  );
}
