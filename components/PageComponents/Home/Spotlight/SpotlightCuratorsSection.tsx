import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SpotlightCuratorEntityDAO, SpotlightEntityDAO, SpotlightSectionDAO } from "@/http/spotlight-api/type";
import { SpotlightCuratorOfWeekCard } from "./SpotlightCuratorOfWeekCard";
import { SpotlightCuratorWatchCard } from "./SpotlightCuratorWatchCard";
import { SpotlightNumberSection } from "./SpotlightNumberSection";
import { SpotlightSectionTitle } from "./SpotlightSectionTitle";

interface SpotlightCuratorsSectionProps {
  section: SpotlightSectionDAO;
}

const MAX_WATCH_CARDS = 4;

// Watch card width (112) + the carousel's gap-2.5 (10).
const CARD_SNAP_INTERVAL = 122;

function isCuratorEntity(item: SpotlightEntityDAO): item is SpotlightCuratorEntityDAO {
  return item.type === "curator";
}

export function SpotlightCuratorsSection({ section }: SpotlightCuratorsSectionProps) {
  const { t } = useTranslation();

  const curators = section.items.filter(isCuratorEntity);
  if (curators.length === 0) return null;

  const [curatorOfWeek, ...rest] = curators;
  const watchCurators = rest.slice(0, MAX_WATCH_CARDS);

  return (
    <View className="mt-[18px]">
      <View className="flex-row items-baseline gap-2">
        <SpotlightNumberSection>{t("spotlight.sections.curators.number")}</SpotlightNumberSection>
        <SpotlightSectionTitle>{t("spotlight.sections.curators.title")}</SpotlightSectionTitle>
      </View>

      <SpotlightCuratorOfWeekCard curator={curatorOfWeek} />

      {watchCurators.length > 0 ? (
        <>
          <Text className="mt-3 font-geist-semibold text-sm tracking-[1px] text-gray-500 dark:text-gray-400">
            {t("spotlight.sections.curators.watchLabel")}
          </Text>
          <ScrollView
            horizontal
            role="list"
            aria-label={t("spotlight.sections.curators.carouselLabel", {
              count: watchCurators.length,
            })}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={CARD_SNAP_INTERVAL}
            snapToAlignment="start"
            contentContainerClassName="gap-2.5"
            className="mt-2"
          >
            {watchCurators.map((curator) => (
              <SpotlightCuratorWatchCard key={curator.id} curator={curator} />
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}
