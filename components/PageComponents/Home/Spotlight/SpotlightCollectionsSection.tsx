import { View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SpotlightCollectionEntityDAO, SpotlightEntityDAO, SpotlightSectionDAO } from "@/http/spotlight-api/type";
import { SpotlightCollectionCoverCard } from "./SpotlightCollectionCoverCard";
import { SpotlightNumberSection } from "./SpotlightNumberSection";
import { SpotlightSectionTitle } from "./SpotlightSectionTitle";

interface SpotlightCollectionsSectionProps {
  section: SpotlightSectionDAO;
}

function isCollectionEntity(item: SpotlightEntityDAO): item is SpotlightCollectionEntityDAO {
  return item.type === "collection";
}

export function SpotlightCollectionsSection({ section }: SpotlightCollectionsSectionProps) {
  const { t } = useTranslation();

  const collections = section.items.filter(isCollectionEntity);
  if (collections.length === 0) return null;

  // Launch default slot count for this section is 1 (spotlight/models.py's
  // SpotlightSlotConfig seed data, §1.3) — a single cover card, not a carousel.
  const [collection] = collections;

  return (
    <View className="mt-[18px]">
      <View className="flex-row items-baseline gap-2">
        <SpotlightNumberSection>{t("spotlight.sections.collections.number")}</SpotlightNumberSection>
        <SpotlightSectionTitle>{t("spotlight.sections.collections.title")}</SpotlightSectionTitle>
      </View>

      <SpotlightCollectionCoverCard collection={collection} />
    </View>
  );
}
