import { useSimilarScores } from "@/hooks/useSimilarScores";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";

interface MatchBadgeProps {
  userId: string;
  enabled?: boolean;
}

/**
 * Fetches similarity for a user and shows the active MATCH_SCORE_MODE percent.
 * Renders via PersonalityMatchPill so styling stays shared.
 */
export function MatchBadge({
  userId,
  enabled = true,
}: MatchBadgeProps) {
  const { matchPercent, isLoading } = useSimilarScores(userId, enabled);

  // Held back only while fetching — a resolved-but-absent score shows as 0%.
  if (!enabled || isLoading) {
    return null;
  }

  return <PersonalityMatchPill percent={matchPercent ?? 0} size="md" />;
}
