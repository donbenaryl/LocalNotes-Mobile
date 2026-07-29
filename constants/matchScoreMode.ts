/**
 * Which match % the app displays.
 *
 * To switch: comment the active line, uncomment the other.
 * Keep in sync with:
 *   - LocalNotes-Frontend/app/constants/matchScoreMode.ts
 *   - LocalNotes-backend/recommendations/match_score_mode.py
 */
export const MATCH_SCORE_MODE = "personality" as const;
// export const MATCH_SCORE_MODE = "overall" as const;

export type MatchScoreMode = typeof MATCH_SCORE_MODE;
