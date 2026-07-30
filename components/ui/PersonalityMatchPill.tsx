import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getPersonalityMatchPillStyle } from "@/utils/personalityRing";

/** Fixed green used by card overlay badges (matches design refs). */
const OVERLAY_GREEN = "#0F6E56";

interface PersonalityMatchPillProps {
  /** Server-computed personality match, 0-100. Renders nothing when null or ≤ 0. */
  percent?: number | null;
  personalityColor?: Record<string, number> | null;
  size?: "sm" | "md";
  /**
   * `inline` — tinted chip used in author rows / modals.
   * `overlay` — white pill with green dot + % + “Personality Match” (list cards).
   * `overlayCompact` — white pill with green % only (pick cards).
   */
  variant?: "inline" | "overlay" | "overlayCompact";
}

/**
 * Presentational only — pass a precomputed 0-100 percent (never fetches).
 * Which metric that percent represents is chosen by MATCH_SCORE_MODE helpers.
 */
export function PersonalityMatchPill({
  percent,
  personalityColor,
  size = "sm",
  variant = "inline",
}: PersonalityMatchPillProps) {
  const { t } = useTranslation();

  if (percent == null || percent <= 0) return null;

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  if (variant === "overlay" || variant === "overlayCompact") {
    return (
      <View
        accessibilityRole="text"
        className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1"
      >
        {variant === "overlay" ? (
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: OVERLAY_GREEN }}
          />
        ) : null}
        <Text
          className="font-geist-bold text-[12px]"
          style={{ color: OVERLAY_GREEN }}
          numberOfLines={1}
        >
          {`${clamped}%`}
        </Text>
        {variant === "overlay" ? (
          <Text
            className="font-geist-bold text-[12px] text-ink"
            numberOfLines={1}
          >
            {t("home.forYou.personalityMatchLabel")}
          </Text>
        ) : null}
      </View>
    );
  }

  const pillStyle = getPersonalityMatchPillStyle(personalityColor);

  return (
    <View
      accessibilityRole="text"
      className={
        size === "md"
          ? "shrink-0 rounded-md px-2.5 py-1"
          : "shrink-0 rounded-md px-2 py-0.5"
      }
      style={{ backgroundColor: pillStyle.backgroundColor }}
    >
      <Text
        className={
          size === "md"
            ? "font-geist-bold text-sm"
            : "font-geist-bold text-[11.5px]"
        }
        style={{ color: pillStyle.color }}
        numberOfLines={1}
      >
        {t("home.forYou.match", { percent: clamped })}
      </Text>
    </View>
  );
}
