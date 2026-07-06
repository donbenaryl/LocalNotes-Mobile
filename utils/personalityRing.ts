const PERSONALITY_ROLE_COLORS: Record<string, string> = {
  explorer: "#0F6E56",
  connector: "#534AB7",
  curator: "#BA7517",
  creator: "#D4537E",
};

const PERSONALITY_MATCH_TEXT: Record<string, string> = {
  "#BA7517": "#7c4f0e",
  "#0F6E56": "#0a4d3c",
  "#534AB7": "#3d3690",
  "#D4537E": "#9c3a5d",
};

const DEFAULT_RING_COLORS = ["#BA7517", "#534AB7", "#0F6E56", "#D4537E"];

export function getDominantPersonalityColor(
  personalityColor?: Record<string, number> | null,
): string {
  const sorted = Object.entries(personalityColor ?? {}).sort(
    ([, a], [, b]) => b - a,
  );
  return sorted[0]?.[0] ?? PERSONALITY_ROLE_COLORS.curator;
}

export function getPersonalityRoleColor(roleOrName: string): string {
  const key = roleOrName.trim().toLowerCase();
  return PERSONALITY_ROLE_COLORS[key] ?? PERSONALITY_ROLE_COLORS.curator;
}

export function getPersonalityGradientColors(
  personalityColor?: Record<string, number> | null,
): string[] {
  const colors = Object.entries(personalityColor ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([color]) => color)
    .slice(0, 4);

  return colors.length > 0 ? colors : DEFAULT_RING_COLORS;
}

export function getPersonalityMatchPillStyle(
  personalityColor?: Record<string, number> | null,
): { backgroundColor: string; color: string } {
  const dominant = getDominantPersonalityColor(personalityColor);

  return {
    backgroundColor: `${dominant}24`,
    color: PERSONALITY_MATCH_TEXT[dominant] ?? dominant,
  };
}
