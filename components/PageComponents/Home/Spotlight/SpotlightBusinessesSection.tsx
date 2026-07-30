import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  SpotlightBusinessEntityDAO,
  SpotlightEntityDAO,
  SpotlightSectionDAO,
} from "@/http/spotlight-api/type";
import { SpotlightBusinessCard } from "./SpotlightBusinessCard";
import { SpotlightNumberSection } from "./SpotlightNumberSection";
import { SpotlightSectionTitle } from "./SpotlightSectionTitle";

interface SpotlightBusinessesSectionProps {
  section: SpotlightSectionDAO;
}

function isBusinessEntity(item: SpotlightEntityDAO): item is SpotlightBusinessEntityDAO {
  return item.type === "business";
}

// Business card width (152) + the carousel's gap-2.5 (10).
const CARD_SNAP_INTERVAL = 162;

export function SpotlightBusinessesSection({ section }: SpotlightBusinessesSectionProps) {
  const { t } = useTranslation();

  const businesses = section.items.filter(isBusinessEntity);
  if (businesses.length === 0) return null;

  return (
    <View className="mt-[18px]">
      <View className="flex-row items-baseline gap-2">
        <SpotlightNumberSection>{t("spotlight.sections.businesses.number")}</SpotlightNumberSection>
        <SpotlightSectionTitle>{t("spotlight.sections.businesses.title")}</SpotlightSectionTitle>
      </View>

      <ScrollView
        horizontal
        role="list"
        aria-label={t("spotlight.sections.businesses.carouselLabel", {
          count: businesses.length,
        })}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_SNAP_INTERVAL}
        snapToAlignment="start"
        contentContainerClassName="gap-2.5"
        className="mt-2.5"
      >
        {businesses.map((business) => (
          <SpotlightBusinessCard key={business.id} business={business} />
        ))}
      </ScrollView>
    </View>
  );
}
