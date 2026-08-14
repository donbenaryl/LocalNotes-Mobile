import { useCallback } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { useRegisterSectionPullToRefresh } from "@/components/ui/SectionPullToRefreshContext";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { useSpotlightEdition } from "@/hooks/useSpotlightEdition";
import { SpotlightBusinessesSection } from "./SpotlightBusinessesSection";
import { SpotlightCollectionsSection } from "./SpotlightCollectionsSection";
import { SpotlightCuratorsSection } from "./SpotlightCuratorsSection";
import { SpotlightHero } from "./SpotlightHero";
import { SpotlightListsSection } from "./SpotlightListsSection";
import { SpotlightPicksSection } from "./SpotlightPicksSection";
import { SpotlightSponsoredSection } from "./SpotlightSponsoredSection";
import { SpotlightTabSkeleton } from "./SpotlightTabSkeleton";

export function SpotlightTab() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, error, refetch } = useSpotlightEdition();

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  useRegisterSectionPullToRefresh("spotlight", handleRefresh, isRefetching);

  if (isLoading) {
    return <SpotlightTabSkeleton />;
  }

  if (error) {
    return (
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
    );
  }

  if (!data) {
    return (
      <View className="items-center justify-center px-6 py-20">
        <EmptyScreen
          title={t("spotlight.empty")}
          description={t("spotlight.emptyDescription")}
          className="justify-center py-20"
        />
      </View>
    );
  }

  const picksSection = data.sections.find((section) => section.section_key === "picks");
  const listsSection = data.sections.find((section) => section.section_key === "lists");
  const curatorsSection = data.sections.find((section) => section.section_key === "curators");
  const collectionsSection = data.sections.find((section) => section.section_key === "collections");
  const businessesSection = data.sections.find((section) => section.section_key === "businesses");

  return (
    <View className="px-4 pb-8">
      <SpotlightHero edition={data} />
      {picksSection ? <SpotlightPicksSection section={picksSection} /> : null}
      {listsSection ? <SpotlightListsSection section={listsSection} /> : null}
      {curatorsSection ? <SpotlightCuratorsSection section={curatorsSection} /> : null}
      {collectionsSection ? <SpotlightCollectionsSection section={collectionsSection} /> : null}
      {businessesSection ? <SpotlightBusinessesSection section={businessesSection} /> : null}
      <SpotlightSponsoredSection sponsored={data.sponsored} />
    </View>
  );
}
