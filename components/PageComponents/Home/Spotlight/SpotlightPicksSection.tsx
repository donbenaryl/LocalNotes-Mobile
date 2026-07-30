import { useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSpotlightSwipeCue } from "@/hooks/useSpotlightSwipeCue";
import type { SpotlightEntityDAO, SpotlightPickEntityDAO, SpotlightSectionDAO } from "@/http/spotlight-api/type";
import { SpotlightNumberSection } from "./SpotlightNumberSection";
import { SpotlightPickPosterCard } from "./SpotlightPickPosterCard";
import { SpotlightSectionTitle } from "./SpotlightSectionTitle";

interface SpotlightPicksSectionProps {
  section: SpotlightSectionDAO;
}

// Poster card width (168) + the carousel's gap-2.5 (10) — keeps momentum
// scrolling snapping to a card boundary at rest, matching spotlight-v4's
// `scroll-snap-type: x proximity` carousel convention.
const CARD_SNAP_INTERVAL = 178;

function isPickEntity(item: SpotlightEntityDAO): item is SpotlightPickEntityDAO {
  return item.type === "pick";
}

export function SpotlightPicksSection({ section }: SpotlightPicksSectionProps) {
  const { t } = useTranslation();
  const { visible: showSwipeCue, dismiss: dismissSwipeCue } = useSpotlightSwipeCue();
  const hasDismissedOnScroll = useRef(false);

  const picks = section.items.filter(isPickEntity);
  if (picks.length === 0) return null;

  const handleScroll = (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (hasDismissedOnScroll.current) return;
    hasDismissedOnScroll.current = true;
    dismissSwipeCue();
  };

  return (
    <View className="mt-[18px]">
      <View className="flex-row items-baseline gap-2">
        <SpotlightNumberSection>{t("spotlight.sections.picks.number")}</SpotlightNumberSection>
        <SpotlightSectionTitle>{t("spotlight.sections.picks.title")}</SpotlightSectionTitle>
      </View>

      <View className="relative mt-2.5">
        {showSwipeCue ? (
          <View
            pointerEvents="none"
            aria-hidden
            className="absolute right-2.5 top-[95px] z-10 flex-row items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1.5"
          >
            <Text className="font-geist-semibold text-[10.5px] text-white">
              {t("spotlight.swipeCue")}
            </Text>
            <ChevronRight size={12} color="#FFFFFF" />
          </View>
        ) : null}

        <ScrollView
          horizontal
          role="list"
          aria-label={t("spotlight.sections.picks.carouselLabel", { count: picks.length })}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={CARD_SNAP_INTERVAL}
          snapToAlignment="start"
          contentContainerClassName="gap-2.5"
        >
          {picks.map((pick) => (
            <SpotlightPickPosterCard key={pick.id} pick={pick} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
