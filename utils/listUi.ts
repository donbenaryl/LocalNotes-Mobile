import type { Location } from "@/http/list-api/types";
import { getDominantPersonalityColor } from "@/utils/personalityRing";

export function formatListLocation(location?: Location | null): string {
  if (!location) return "";

  const cityPart = location.city
    ? `${location.city}${location.region ? `, ${location.region}` : ""}`
    : "";
  const countryPart = location.country ? `, ${location.country}` : "";

  return `${cityPart}${countryPart}`.trim().replace(/^,\s*/, "");
}

export function getDominantPersonalityTextColor(
  personalityColor?: Record<string, number> | null,
): string {
  return getDominantPersonalityColor(personalityColor);
}
