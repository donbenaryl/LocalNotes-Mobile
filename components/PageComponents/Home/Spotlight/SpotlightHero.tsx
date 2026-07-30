import { Image, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useSpotlightImageFallback } from "@/hooks/useSpotlightImageFallback";
import { resolveImageUrl } from "@/utils/httpHelpers";
import type { SpotlightEditionDAO } from "@/http/spotlight-api/type";
import { SpotlightFallbackGradient } from "./SpotlightFallbackGradient";

interface SpotlightHeroProps {
  edition: SpotlightEditionDAO;
}

// Out of scope for §3.13's event-logging wiring: the hero is synthesized
// from `edition.hero` (image/copy/kicker), not from a `SpotlightItem` row —
// `spotlight/public.py::build_hero` returns no id at all, so there is no
// `spotlight_item_id` to call the impression/open/save/cta-click endpoints
// with, even when the hero happens to visually derive from the top Pick.

const FALLBACK_GRADIENT_COLORS = ["#3D2818", "#C4622D"] as const;
const GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function formatHeroDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const endMonth = end.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

function resolveTopPickImage(edition: SpotlightEditionDAO): string | null {
  const picksSection = edition.sections.find((section) => section.section_key === "picks");
  const topPick = picksSection?.items[0];
  if (!topPick || topPick.type !== "pick") return null;
  return resolveImageUrl(topPick.image);
}

function resolveHeroSubtitle(
  copy: string | null,
  city: string,
  t: (key: string) => string,
): string {
  if (!copy) return t("spotlight.hero.subtitle");
  // Backend derives this exact placeholder string when admin hasn't authored
  // custom hero copy — treat it the same as unset so the generic marketing
  // subtitle shows instead of a redundant echo of the title.
  if (copy.trim() === `This week in ${city}`) return t("spotlight.hero.subtitle");
  return copy;
}

export function SpotlightHero({ edition }: SpotlightHeroProps) {
  const { t } = useTranslation();

  const heroImageUrl = resolveImageUrl(edition.hero.image) ?? resolveTopPickImage(edition);
  const { showFallback, onError } = useSpotlightImageFallback(heroImageUrl);
  const dateRange = formatHeroDateRange(edition.week_start_date, edition.week_end_date);
  const kicker = t("spotlight.hero.kicker", { dateRange });
  const subtitle = resolveHeroSubtitle(edition.hero.copy, edition.city, t);

  return (
    <View className="relative mt-3 h-[158px] overflow-hidden rounded-[18px]">
      {showFallback ? (
        <SpotlightFallbackGradient colors={FALLBACK_GRADIENT_COLORS} />
      ) : (
        <Image
          source={{ uri: heroImageUrl as string }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
          onError={onError}
        />
      )}

      <LinearGradient
        colors={["rgba(10,7,4,0.9)", "rgba(10,7,4,0.35)", "rgba(10,7,4,0.08)"]}
        locations={[0.18, 0.55, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={GRADIENT_FILL}
      />

      <Text className="absolute left-3.5 top-3 text-md font-geist-semibold uppercase tracking-[2px] text-white/90">
        {kicker}
      </Text>

      <View className="absolute bottom-3.5 left-3.5 right-3.5">
        <Text className="text-3xl font-geist-bold text-white">
          {t("spotlight.hero.title")}{" "}
          <Text className="italic text-[#FFB07C]">
            {t("spotlight.hero.titleAccent", { city: edition.city })}
          </Text>
        </Text>
        <Text className="mt-1 text-white/90" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
