import {
  SEARCH_SUGGESTIONS_LIMIT,
  TRAIT_SIDE_TO_SUGGESTION,
  type SearchSuggestion,
} from "@/constants/searchSuggestions";
import type { UserProfileData } from "@/http/account-api/types";

type TraitScoreLike = {
  trait: {
    left_side: { label: string };
    right_side: { label: string };
  };
  left_value: number;
  right_value: number;
};

function dominantTraitSideLabels(profile: UserProfileData | null | undefined): string[] {
  const scores: TraitScoreLike[] | undefined = profile?.trait_scores?.length
    ? profile.trait_scores
    : profile?.inferred_trait_scores;

  if (!scores?.length) return [];

  const labels: string[] = [];
  for (const score of scores) {
    if (score.right_value > score.left_value && score.right_value !== 50) {
      labels.push(score.trait.right_side.label);
    } else if (score.left_value > score.right_value && score.left_value !== 50) {
      labels.push(score.trait.left_side.label);
    }
  }
  return labels;
}

function coversLabel(existing: SearchSuggestion[], candidate: string): boolean {
  const lower = candidate.toLowerCase();
  return existing.some(
    (row) =>
      row.label.toLowerCase() === lower ||
      row.label.toLowerCase().startsWith(lower) ||
      lower.startsWith(row.label.toLowerCase()),
  );
}

/**
 * Builds "Suggested for you" rows from personality + often-used vibes.
 * Popular-in-city is intentionally omitted until a consumer API exists.
 */
export function buildSearchSuggestions(options: {
  profile: UserProfileData | null | undefined;
  recentVibes: string[];
  /** Reserved for a later plan — ignored today. */
  popularTerm?: string | null;
}): SearchSuggestion[] {
  const rows: SearchSuggestion[] = [];

  for (const traitLabel of dominantTraitSideLabels(options.profile)) {
    const mapped = TRAIT_SIDE_TO_SUGGESTION[traitLabel];
    if (!mapped) continue;
    if (coversLabel(rows, mapped)) continue;
    rows.push({ label: mapped, source: "vibe_answers" });
    if (rows.length >= SEARCH_SUGGESTIONS_LIMIT) {
      return rows;
    }
  }

  for (const vibe of options.recentVibes) {
    const label = `${vibe} spots`;
    if (coversLabel(rows, vibe) || coversLabel(rows, label)) continue;
    rows.push({ label, source: "vibe_often" });
    if (rows.length >= SEARCH_SUGGESTIONS_LIMIT) {
      return rows;
    }
  }

  // Extension point: when popular-in-city API lands, append:
  // if (options.popularTerm && !coversLabel(rows, options.popularTerm)) {
  //   rows.push({ label: options.popularTerm, source: "popular_city" });
  // }

  return rows.slice(0, SEARCH_SUGGESTIONS_LIMIT);
}
