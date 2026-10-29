import type {
  InsightsMembershipStatus,
  OwnedBusinessDAO,
} from '@/http/business-api/types';

export type BranchInsightsMembership = {
  isPaid: boolean;
  status: InsightsMembershipStatus | null;
};

const NOT_PAID: BranchInsightsMembership = { isPaid: false, status: null };

/**
 * Insights entitlement for one branch, read from the owned-business (`/mine`)
 * payload already in `useBusinessStore` — never the public business detail,
 * which does not carry the flag. A missing value means not paid.
 *
 * Reuse this for future paid fetchers (`enabled: hasBusiness && isPaid`)
 * instead of calling `useBusinessHomeData`, which fires the topline queries.
 */
export function getBranchInsightsMembership(
  ownedBusinesses: OwnedBusinessDAO[],
  businessId: string | null | undefined,
  branchId: string | null | undefined,
): BranchInsightsMembership {
  if (!businessId || !branchId) return NOT_PAID;
  const branch = ownedBusinesses
    .find((business) => business.id === businessId)
    ?.branches?.find((item) => item.id === branchId);
  const membership = branch?.insights_membership;
  if (!membership) return NOT_PAID;
  return { isPaid: membership.active === true, status: membership.status ?? null };
}
