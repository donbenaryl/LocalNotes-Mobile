import { QUESTION_GROUPS } from '@/constants/personality';
import type { UserProfileData } from '@/http/account-api/types';
import type { MatchPriorities } from '@/components/ui/MatchThreshhold';
import type { PersonalityQuestion } from '@/types/personality';

export function slugifyTraitLabel(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

/**
 * Maps selected `MatchPriorities` (question id -> "left" | "right") to the
 * `TraitSide.slug` values the `personality_sides` query param expects.
 * Slugs are ordered by question id so query keys stay deterministic.
 */
export function personalitySidesFromPriorities(
  priorities: MatchPriorities,
): string[] {
  const questionIds = Object.keys(priorities)
    .map(Number)
    .sort((a, b) => a - b);

  if (questionIds.length === 0) {
    return [];
  }

  const questionById = new Map<number, PersonalityQuestion>();
  for (const group of QUESTION_GROUPS) {
    for (const item of group.items) {
      questionById.set(item.id, item);
    }
  }

  const slugs: string[] = [];
  for (const id of questionIds) {
    const question = questionById.get(id);
    if (!question) continue;
    const side = priorities[id];
    const label = side === 'right' ? question.rightLabel : question.leftLabel;
    slugs.push(slugifyTraitLabel(label));
  }

  return slugs;
}

function traitPairKey(leftSlug: string, rightSlug: string) {
  return `${leftSlug}:${rightSlug}`;
}

export function buildAnswersFromTraitScores(
  traitScores: UserProfileData['trait_scores'],
  questions: PersonalityQuestion[],
): Record<number, number> {
  const scoreByPair = new Map<string, number>();

  for (const score of traitScores) {
    const key = traitPairKey(
      score.trait.left_side.slug,
      score.trait.right_side.slug,
    );
    scoreByPair.set(key, score.right_value);
  }

  const answers: Record<number, number> = {};

  for (const item of questions) {
    const key = traitPairKey(
      slugifyTraitLabel(item.leftLabel),
      slugifyTraitLabel(item.rightLabel),
    );
    const value = scoreByPair.get(key);
    if (value !== undefined) {
      answers[item.id] = value;
    }
  }

  return answers;
}

export function buildTouchedFromAnswers(
  answers: Record<number, number>,
): Record<number, boolean> {
  return Object.fromEntries(
    Object.keys(answers).map((id) => [Number(id), true]),
  );
}
