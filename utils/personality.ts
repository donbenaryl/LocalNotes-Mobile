export function hasCompletedPersonalityQuiz(
  personalityName?: string | null,
): boolean {
  return Boolean(personalityName?.trim());
}

export function getPostAuthRoute(
  personalityName?: string | null,
): '/personality' | '/home' {
  return hasCompletedPersonalityQuiz(personalityName)
    ? '/home'
    : '/personality';
}
