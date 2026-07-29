import { MATCH_SCORE_MODE } from "@/constants/matchScoreMode";
import type { similarUserScore } from "@/http/recommendations-api/types";

interface MatchFields {
  personality_match?: number | null;
  overall_match?: number | null;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Resolve the display match % from a similarity API payload.
 * Both personality and overall branches stay live — switch via MATCH_SCORE_MODE.
 */
export function getMatchPercentFromSimilarity(
  score: similarUserScore | null | undefined,
): number | null {
  if (!score) return null;

  if (MATCH_SCORE_MODE === "personality") {
    if (score.personality_similarity === undefined || score.personality_similarity === null) {
      return null;
    }
    return clampPercent(score.personality_similarity);
  }

  // overall
  if (score.reason?.overall_score === undefined || score.reason.overall_score === null) {
    return null;
  }
  return clampPercent(score.reason.overall_score);
}

/**
 * Resolve match % from list / account / owner fields embedded in payloads.
 */
export function getEmbeddedMatchPercent(
  source: MatchFields | null | undefined,
): number | null {
  if (!source) return null;

  if (MATCH_SCORE_MODE === "personality") {
    if (source.personality_match == null) return null;
    return clampPercent(source.personality_match);
  }

  // overall
  if (source.overall_match == null) return null;
  return clampPercent(source.overall_match);
}

/** List card: top-level field, then nested account. */
export function getListMatchPercent(list: {
  personality_match?: number | null;
  overall_match?: number | null;
  account?: MatchFields | null;
} | null | undefined): number | null {
  if (!list) return null;
  const top = getEmbeddedMatchPercent(list);
  if (top != null) return top;
  return getEmbeddedMatchPercent(list.account);
}

/** People search / starters: backend `match` already follows MATCH_SCORE_MODE. */
export function getPeopleMatchPercent(
  person: { match?: number | null } | null | undefined,
): number | null {
  if (person?.match == null) return null;
  const value = clampPercent(person.match);
  return value > 0 ? value : null;
}
