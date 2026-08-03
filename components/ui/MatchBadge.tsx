import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSimilarScores } from "@/hooks/useSimilarScores";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";

interface MatchBadgeProps {
  userId: string;
  personalityColor?: Record<string, number> | null;
  enabled?: boolean;
}

/**
 * Fetches similarity for a user and shows the active MATCH_SCORE_MODE percent.
 * Renders via PersonalityMatchPill so styling stays shared.
 */
export function MatchBadge({
  userId,
  personalityColor,
  enabled = true,
}: MatchBadgeProps) {
  const { matchPercent, isLoading } = useSimilarScores(userId, enabled);

  // Held back only while fetching — a resolved-but-absent score shows as 0%.
  if (!enabled || isLoading) {
    return null;
  }

  return (
    <PersonalityMatchPill
      percent={matchPercent ?? 0}
      personalityColor={personalityColor}
      size="md"
    />
  );
}
