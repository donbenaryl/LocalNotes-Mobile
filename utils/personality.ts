export type PersonalitySource = 'quiz' | 'inferred' | null | undefined;

/** After this many quiz skips (with an empty profile) stop forcing /personality on launch. */
export const MAX_PERSONALITY_QUIZ_SKIPS = 2;

export function hasCompletedPersonalityQuiz(
  personalityName?: string | null,
): boolean {
  return Boolean(personalityName?.trim());
}

/** True once the profile has a personality of any kind (quiz or auto-filled from activity). */
export function hasPersonality(
  personalityName?: string | null,
  source?: PersonalitySource,
): boolean {
  return source === 'quiz' || source === 'inferred' || hasCompletedPersonalityQuiz(personalityName);
}

/** Show the "based on your activity" label + quiz CTA. */
export function isInferredPersonality(source?: PersonalitySource): boolean {
  return source === 'inferred';
}

export function getPostAuthRoute(
  personalityName?: string | null,
  options?: { source?: PersonalitySource; skipCount?: number },
): '/personality' | '/home' {
  if (hasPersonality(personalityName, options?.source)) return '/home';
  if ((options?.skipCount ?? 0) >= MAX_PERSONALITY_QUIZ_SKIPS) return '/home';
  return '/personality';
}
