import { useCallback, type ReactNode } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { useRegisterSectionPullToRefresh } from "@/components/ui/SectionPullToRefreshContext";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { LocationPickerChip } from "@/components/ui/LocationInputModal";
import { useSelectableLocation } from "@/hooks/useSelectableLocation";
import { useSpotlightEdition } from "@/hooks/useSpotlightEdition";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { SpotlightBusinessesSection } from "./SpotlightBusinessesSection";
import { SpotlightCollectionsSection } from "./SpotlightCollectionsSection";
import { SpotlightCuratorsSection } from "./SpotlightCuratorsSection";
import { SpotlightHero } from "./SpotlightHero";
import { SpotlightListsSection } from "./SpotlightListsSection";
import { SpotlightPicksSection } from "./SpotlightPicksSection";
import { SpotlightSponsoredSection } from "./SpotlightSponsoredSection";
import { SpotlightTabSkeleton } from "./SpotlightTabSkeleton";

function SpotlightLocationBar({
  cityLabel,
  isLoading,
  onLocationSelected,
}: {
  cityLabel: string;
  isLoading: boolean;
  onLocationSelected: (location: GeoLocation) => void;
}) {
  return (
    <View className="mb-1 flex-row items-center justify-end px-4">
      <LocationPickerChip
        cityLabel={cityLabel}
        isLoading={isLoading}
        onLocationSelected={onLocationSelected}
      />
    </View>
  );
}

function SpotlightShell({
  cityLabel,
  isLocationLoading,
  onLocationSelected,
  children,
}: {
  cityLabel: string;
  isLocationLoading: boolean;
  onLocationSelected: (location: GeoLocation) => void;
  children: ReactNode;
}) {
  return (
    <View>
      <SpotlightLocationBar
        cityLabel={cityLabel}
        isLoading={isLocationLoading}
        onLocationSelected={onLocationSelected}
      />
      {children}
    </View>
  );
}

export function SpotlightTab() {
  const { t } = useTranslation();
  const {
    cityLabel,
    isLoading: isLocationLoading,
    cityForQuery,
    onLocationSelected,
  } = useSelectableLocation();
  const { data, isLoading, isRefetching, error, refetch } = useSpotlightEdition(
    cityForQuery,
    !isLocationLoading,
  );

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  useRegisterSectionPullToRefresh("spotlight", handleRefresh, isRefetching);

  const shellProps = {
    cityLabel,
    isLocationLoading,
    onLocationSelected,
  };

  if (isLoading || isLocationLoading) {
    return (
      <SpotlightShell {...shellProps}>
        <SpotlightTabSkeleton />
      </SpotlightShell>
    );
  }

  if (error) {
    return (
      <SpotlightShell {...shellProps}>
        <View className="items-center justify-center px-6 py-20">
          <Text className="mb-4 text-center font-geist text-base text-gray-600 dark:text-gray-400">
            {t("spotlight.error")}
          </Text>
          <LocalNotesButton
            label={t("spotlight.retry")}
            onPress={() => void refetch()}
            variant="dark"
            isRounded
          />
        </View>
      </SpotlightShell>
    );
  }

  if (!data) {
    return (
      <SpotlightShell {...shellProps}>
        <View className="items-center justify-center px-6 py-20">
          <EmptyScreen
            title={t("spotlight.empty")}
            description={t("spotlight.emptyDescription")}
            className="justify-center py-20"
          />
        </View>
      </SpotlightShell>
    );
  }

  const picksSection = data.sections.find((section) => section.section_key === "picks");
  const listsSection = data.sections.find((section) => section.section_key === "lists");
  const curatorsSection = data.sections.find((section) => section.section_key === "curators");
  const collectionsSection = data.sections.find((section) => section.section_key === "collections");
  const businessesSection = data.sections.find((section) => section.section_key === "businesses");

  return (
    <SpotlightShell {...shellProps}>
      <View className="px-4">
        <SpotlightHero edition={data} />
        {picksSection ? <SpotlightPicksSection section={picksSection} /> : null}
        {listsSection ? <SpotlightListsSection section={listsSection} /> : null}
        {curatorsSection ? <SpotlightCuratorsSection section={curatorsSection} /> : null}
        {collectionsSection ? <SpotlightCollectionsSection section={collectionsSection} /> : null}
        {businessesSection ? <SpotlightBusinessesSection section={businessesSection} /> : null}
        <SpotlightSponsoredSection sponsored={data.sponsored} />
      </View>
    </SpotlightShell>
  );
}
