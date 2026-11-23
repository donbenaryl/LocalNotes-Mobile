import { Text, View } from "react-native";
import { clampPercent, getMatchPercentColor } from "@/utils/matchScore";

interface PersonalityMatchPillProps {
  /** Server-computed personality match, 0-100. Null / missing renders nothing (unknown is not 0%). */
  percent?: number | null;
  size?: "sm" | "md";
  /**
   * `inline` — score-band tinted chip used in author rows / modals.
   * `overlay` — white pill with score-band dot + % (list cards).
   * `overlayCompact` — white pill with score-band % only (pick cards).
   */
  variant?: "inline" | "overlay" | "overlayCompact";
}

/**
 * Presentational only — pass a precomputed 0-100 percent (never fetches).
 * Which metric that percent represents is chosen by MATCH_SCORE_MODE helpers.
 * Renders nothing when percent is null/undefined — unknown is not 0%.
 */
export function PersonalityMatchPill({
  percent,
  size = "sm",
  variant = "inline",
}: PersonalityMatchPillProps) {
  if (percent == null) return null;
  const clamped = clampPercent(percent);
  const color = getMatchPercentColor(clamped);

  if (variant === "overlay" || variant === "overlayCompact") {
    return (
      <View
        accessibilityRole="text"
        className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-black/10 bg-card px-2.5 py-1"
      >
        {variant === "overlay" ? (
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        ) : null}
        <Text
          className="font-geist-bold text-[12px]"
          style={{ color }}
          numberOfLines={1}
        >
          {`${clamped}%`}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="text"
      className={
        size === "md"
          ? "shrink-0 rounded-md px-2.5 py-1"
          : "shrink-0 rounded-md px-2 py-0.5"
      }
      style={{ backgroundColor: `${color}24` }}
    >
      <Text
        className={
          size === "md"
            ? "font-geist-bold text-sm"
            : "font-geist-bold text-[11.5px]"
        }
        style={{ color }}
        numberOfLines={1}
      >
        {`${clamped}%`}
      </Text>
    </View>
  );
}
