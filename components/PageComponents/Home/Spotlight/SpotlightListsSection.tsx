import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { SpotlightEntityDAO, SpotlightListEntityDAO, SpotlightSectionDAO } from "@/http/spotlight-api/type";
import { ListDetailModal } from "@/components/ui/ListDetailModal";
import { SpotlightListLandscapeCard } from "./SpotlightListLandscapeCard";
import { SpotlightListsHeroCard } from "./SpotlightListsHeroCard";
import { SpotlightNumberSection } from "./SpotlightNumberSection";
import { SpotlightSectionTitle } from "./SpotlightSectionTitle";

interface SpotlightListsSectionProps {
  section: SpotlightSectionDAO;
}

const MAX_LANDSCAPE_CARDS = 5;

// Landscape card width (208) + the carousel's gap-2.5 (10).
const CARD_SNAP_INTERVAL = 218;

function isListEntity(item: SpotlightEntityDAO): item is SpotlightListEntityDAO {
  return item.type === "list";
}

export function SpotlightListsSection({ section }: SpotlightListsSectionProps) {
  const { t } = useTranslation();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const lists = section.items.filter(isListEntity);
  if (lists.length === 0) return null;

  const [heroList, ...remainingLists] = lists;
  const carouselLists = remainingLists.slice(0, MAX_LANDSCAPE_CARDS);

  return (
    <View className="mt-[18px]">
      <View className="flex-row items-baseline gap-2">
        <SpotlightNumberSection>{t("spotlight.sections.lists.number")}</SpotlightNumberSection>
        <SpotlightSectionTitle>{t("spotlight.sections.lists.title")}</SpotlightSectionTitle>
        {section.fallback_label ? (
          <View className="ml-auto flex-row items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-800">
            <MapPin size={10} color="#5C5A50" />
            {/* fallback_label is a fully-composed, backend-formatted string
                (e.g. "FROM ARIZONA" / "FROM GREATER PHOENIX" / "FROM AROUND
                THE WORLD" — see spotlight/public.py::fallback_chip_label),
                not a bare region name, so it's rendered as-is rather than
                run through the spotlight.fallbackChip "FROM {{region}}"
                template (which would double the "FROM " prefix). */}
            <Text className="font-geist-semibold text-[10px] tracking-[0.5px] text-gray-500 dark:text-gray-400">
              {section.fallback_label}
            </Text>
          </View>
        ) : null}
      </View>

      <SpotlightListsHeroCard list={heroList} onPressList={setSelectedListId} />

      {carouselLists.length > 0 ? (
        <ScrollView
          horizontal
          role="list"
          aria-label={t("spotlight.sections.lists.carouselLabel", { count: carouselLists.length })}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_SNAP_INTERVAL}
          snapToAlignment="start"
          contentContainerClassName="gap-2.5"
          className="mt-2.5"
        >
          {carouselLists.map((list) => (
            <SpotlightListLandscapeCard
              key={list.id}
              list={list}
              onPressList={setSelectedListId}
            />
          ))}
        </ScrollView>
      ) : null}

      <ListDetailModal
        visible={selectedListId != null}
        listId={selectedListId}
        onClose={() => setSelectedListId(null)}
      />
    </View>
  );
}
