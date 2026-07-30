import { View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SpotlightEntityDAO } from "@/http/spotlight-api/type";
import { SpotlightNumberSection } from "./SpotlightNumberSection";
import { SpotlightSectionTitle } from "./SpotlightSectionTitle";
import { SpotlightSponsoredCard } from "./SpotlightSponsoredCard";

interface SpotlightSponsoredSectionProps {
  sponsored: SpotlightEntityDAO | undefined;
}

export function SpotlightSponsoredSection({ sponsored }: SpotlightSponsoredSectionProps) {
  const { t } = useTranslation();

  // §1.9: sponsored is omitted from the payload entirely (not an empty
  // section) whenever the edition has no sold slot — so this section,
  // header included, must render nothing at all rather than an empty state.
  if (!sponsored || sponsored.type !== "business") return null;

  return (
    <View className="mt-[18px]">
      {/* Quiet header treatment: muted number/title, not the brand-orange
          number other sections use — matches the reference mock's
          `.sechead.quiet` lower-visual-weight styling. */}
      <View className="flex-row items-baseline gap-2">
        <SpotlightNumberSection quiet>{t("spotlight.sections.sponsored.number")}</SpotlightNumberSection>
        <SpotlightSectionTitle quiet>{t("spotlight.sections.sponsored.title")}</SpotlightSectionTitle>
      </View>

      <SpotlightSponsoredCard business={sponsored} />
    </View>
  );
}
