import type { UserProfileData } from '@/http/account-api/types';
import type { PersonalityQuestion } from '@/types/personality';

export function slugifyTraitLabel(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
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
    scoreByPair.set(key, score.left_value);
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
