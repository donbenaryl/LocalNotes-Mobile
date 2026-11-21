import {
  MAX_PERSONALITY_QUIZ_SKIPS,
  getPostAuthRoute,
  hasPersonality,
  isInferredPersonality,
} from './personality';

describe('getPostAuthRoute', () => {
  it('forces the quiz for an empty profile', () => {
    expect(getPostAuthRoute(null)).toBe('/personality');
    expect(getPostAuthRoute(undefined, { source: null, skipCount: 0 })).toBe('/personality');
  });
  it('goes home when a personality name exists', () => {
    expect(getPostAuthRoute('The Explorer')).toBe('/home');
  });
  it('goes home for quiz and inferred sources even without a name', () => {
    expect(getPostAuthRoute(null, { source: 'quiz' })).toBe('/home');
    expect(getPostAuthRoute(null, { source: 'inferred' })).toBe('/home');
  });
  it('stops forcing the quiz after enough skips', () => {
    expect(getPostAuthRoute(null, { skipCount: MAX_PERSONALITY_QUIZ_SKIPS - 1 })).toBe(
      '/personality',
    );
    expect(getPostAuthRoute(null, { skipCount: MAX_PERSONALITY_QUIZ_SKIPS })).toBe('/home');
  });
});

describe('personality source helpers', () => {
  it('detects inferred', () => {
    expect(isInferredPersonality('inferred')).toBe(true);
    expect(isInferredPersonality('quiz')).toBe(false);
    expect(isInferredPersonality(undefined)).toBe(false);
  });
  it('hasPersonality', () => {
    expect(hasPersonality(null, null)).toBe(false);
    expect(hasPersonality('  ', undefined)).toBe(false);
    expect(hasPersonality(null, 'inferred')).toBe(true);
  });
});
