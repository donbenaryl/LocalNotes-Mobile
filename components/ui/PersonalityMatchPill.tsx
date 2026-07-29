import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getPersonalityMatchPillStyle } from "@/utils/personalityRing";

interface PersonalityMatchPillProps {
  /** Server-computed personality match, 0-100. Renders nothing when null. */
  percent?: number | null;
  personalityColor?: Record<string, number> | null;
  size?: "sm" | "md";
}

/**
 * Presentational only — pass a precomputed 0-100 percent (never fetches).
 * Which metric that percent represents is chosen by MATCH_SCORE_MODE helpers.
 */
export function PersonalityMatchPill({
  percent,
  personalityColor,
  size = "sm",
}: PersonalityMatchPillProps) {
  const { t } = useTranslation();

  if (percent == null) return null;

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
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
