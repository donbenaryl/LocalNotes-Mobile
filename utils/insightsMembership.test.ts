import { getBranchInsightsMembership } from '@/utils/insightsMembership';
import type {
  BusinessBranchDAO,
  InsightsMembershipDAO,
  OwnedBusinessDAO,
} from '@/http/business-api/types';

const branch = (id: string, insights_membership?: InsightsMembershipDAO) =>
  ({ id, name: id, location: {}, insights_membership }) as unknown as BusinessBranchDAO;

const business = (id: string, branches: BusinessBranchDAO[]): OwnedBusinessDAO => ({
  id,
  name: id,
  role: 'Owner',
  is_primary: true,
  location_count: branches.length,
  branches,
});

const owned = [
  business('b1', [
    branch('paid', { active: true, status: 'active' }),
    branch('unpaid', { active: false, status: null }),
    branch('grace', { active: true, status: 'past_due' }),
    branch('legacy'),
  ]),
  business('b2', [branch('other', { active: true, status: 'trialing' })]),
];

describe('getBranchInsightsMembership', () => {
  it('returns paid for an entitled branch', () => {
    expect(getBranchInsightsMembership(owned, 'b1', 'paid')).toEqual({
      isPaid: true,
      status: 'active',
    });
  });

  it('returns not paid for an unentitled branch', () => {
    expect(getBranchInsightsMembership(owned, 'b1', 'unpaid')).toEqual({
      isPaid: false,
      status: null,
    });
  });

  it('keeps past_due paid while the backend reports active (grace)', () => {
    expect(getBranchInsightsMembership(owned, 'b1', 'grace')).toEqual({
      isPaid: true,
      status: 'past_due',
    });
  });

  it('treats a missing insights_membership field as not paid', () => {
    expect(getBranchInsightsMembership(owned, 'b1', 'legacy').isPaid).toBe(false);
  });

  it('scopes the lookup to the given business', () => {
    expect(getBranchInsightsMembership(owned, 'b1', 'other').isPaid).toBe(false);
    expect(getBranchInsightsMembership(owned, 'b2', 'other').isPaid).toBe(true);
  });

  it('returns not paid for unknown business or branch', () => {
    expect(getBranchInsightsMembership(owned, 'nope', 'paid').isPaid).toBe(false);
    expect(getBranchInsightsMembership(owned, 'b1', 'nope').isPaid).toBe(false);
  });

  it('returns not paid for null/undefined ids', () => {
    expect(getBranchInsightsMembership(owned, null, 'paid').isPaid).toBe(false);
    expect(getBranchInsightsMembership(owned, 'b1', undefined).isPaid).toBe(false);
  });

  it('returns not paid for an empty owned list', () => {
    expect(getBranchInsightsMembership([], 'b1', 'paid').isPaid).toBe(false);
  });
});
