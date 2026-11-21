import {
  getEmbeddedMatchPercent,
  getListMatchPercent,
  getMatchPercentFromSimilarity,
  getPeopleMatchPercent,
} from './matchScore';

describe('unknown match is null, never 0%', () => {
  it('people match', () => {
    expect(getPeopleMatchPercent({ match: null })).toBeNull();
    expect(getPeopleMatchPercent({})).toBeNull();
    expect(getPeopleMatchPercent(undefined)).toBeNull();
    expect(getPeopleMatchPercent({ match: 0 })).toBe(0);
  });

  it('embedded / list match', () => {
    expect(getEmbeddedMatchPercent({})).toBeNull();
    expect(getEmbeddedMatchPercent({ personality_match: null, overall_match: null })).toBeNull();
    expect(getListMatchPercent({ account: { personality_match: null } })).toBeNull();
    expect(getListMatchPercent(null)).toBeNull();
  });

  it('similarity payload', () => {
    expect(getMatchPercentFromSimilarity(null)).toBeNull();
    expect(getMatchPercentFromSimilarity(undefined)).toBeNull();
  });
});
