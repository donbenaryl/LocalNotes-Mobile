import { Text, View } from "react-native";
import { getPersonalityMatchPillStyle } from "@/utils/personalityRing";
import { clampPercent } from "@/utils/matchScore";

/** Fixed green used by card overlay badges (matches design refs). */
const OVERLAY_GREEN = "#0F6E56";

interface PersonalityMatchPillProps {
  /** Server-computed personality match, 0-100. Always renders; null shows as 0%. */
  percent?: number | null;
  personalityColor?: Record<string, number> | null;
  size?: "sm" | "md";
  /**
   * `inline` — tinted chip used in author rows / modals.
   * `overlay` — white pill with green dot + % (list cards).
   * `overlayCompact` — white pill with green % only (pick cards).
   */
  variant?: "inline" | "overlay" | "overlayCompact";
}

/**
 * Presentational only — pass a precomputed 0-100 percent (never fetches).
 * Which metric that percent represents is chosen by MATCH_SCORE_MODE helpers.
 * Always renders — callers gate on ownership, not on the percent being absent.
 */
export function PersonalityMatchPill({
  percent,
  personalityColor,
  size = "sm",
  variant = "inline",
}: PersonalityMatchPillProps) {
  const clamped = clampPercent(percent ?? 0);

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
        {`${clamped}%`}
      </Text>
    </View>
  );
}
