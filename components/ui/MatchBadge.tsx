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

  // Held back while fetching; an absent score renders nothing (pill returns null).
  if (!enabled || isLoading) {
    return null;
  }

  return <PersonalityMatchPill percent={matchPercent} size="md" />;
}
