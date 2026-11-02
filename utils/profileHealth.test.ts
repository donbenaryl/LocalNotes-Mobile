import type {
  BusinessBranchDAO,
  BusinessItemDAO,
  BusinessTypeDAO,
} from '@/http/business-api/types';
import { gradeBusinessProfile } from '@/utils/profileHealth';

import fixture from './profileHealth.fixtures.json';

/**
 * Shared with the backend (`tests/test_profile_health_parity.py`). The canonical copy is
 * `RPI/business/business-smart-alerts/fixtures/profile_health_cases.json`; keep all copies
 * identical. If a case cannot be expressed here, fix the fixture, not the util.
 */
type FixtureCase = (typeof fixture.cases)[number];

const types = fixture.types as unknown as BusinessTypeDAO[];

function toBusiness(spec: FixtureCase['business']): BusinessItemDAO {
  return { ...spec, id: 'b1', status: 'claimed', branches: [], list_count: 0 } as unknown as BusinessItemDAO;
}

function toBranch(spec: FixtureCase['branch']): BusinessBranchDAO | undefined {
  return spec ? ({ id: 'br1', name: 'Main', ...spec } as unknown as BusinessBranchDAO) : undefined;
}

describe('gradeBusinessProfile parity fixture', () => {
  it.each(fixture.cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const result = gradeBusinessProfile(toBusiness(c.business), toBranch(c.branch), types);
    expect(result).toEqual(c.expected);
  });

  it('returns a defined empty result when there is no business', () => {
    expect(gradeBusinessProfile(null, undefined, types)).toEqual({ score: 0, gaps: [] });
  });

  it('does not throw for an unknown type and an empty catalog', () => {
    const c = fixture.cases.find((x) => x.name === 'unknown_business_type')!;
    const result = gradeBusinessProfile(toBusiness(c.business), toBranch(c.branch), []);
    expect(result.score).toBe(75);
  });
});
