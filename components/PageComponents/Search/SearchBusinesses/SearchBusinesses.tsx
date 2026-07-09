import { useTranslation } from "react-i18next";
import { BusinessCard } from "@/components/PageComponents/Business/BusinessCard";
import { SearchResultsLayout } from "@/components/PageComponents/Search/SearchResultsLayout";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useSearchStore } from "@/stores/useSearchStore";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import type { BusinessItemDAO } from "@/http/business-api/types";

function formatCityLabel(location: {
  city: string;
  region?: string;
}): string {
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

export function SearchBusinesses() {
  const { t } = useTranslation();
  const { businesses, isLoading, isPending, error, refetch } =
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
    <SearchResultsLayout<BusinessItemDAO>
      mode="places"
      resultsKind="places"
      businessesForMap={businesses}
      areaLabel={areaLabel}
      data={businesses}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <BusinessCard data={item} />}
      isLoading={isLoading}
      isPending={isPending}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      emptyTitle={t("search.empty.places")}
    />
  );
}
