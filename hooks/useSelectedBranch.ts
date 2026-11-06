import { useMemo } from 'react';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { getBranchInsightsMembership } from '@/utils/insightsMembership';

export type SelectedBranch = {
  businessId: string;
  branchId: string | null;
  branchName: string;
  /** Real entitlement of the selected branch (from `/mine`), never the sibling branches'. */
  isPaid: boolean;
};

/**
 * The branch every Copilot / AI credits screen is scoped to: `useBusinessStore.selectedBranchId`,
 * the same selection Business Home uses. Paid status comes from `getBranchInsightsMembership`
 * (the `__DEV__` paid toggle lives inside one `useBusinessHomeData` instance, so Business Home
 * passes its own `isPaidMember` to the credits hooks as an override).
 */
export function useSelectedBranch(): SelectedBranch {
  const businessId = useBusinessStore((s) => s.businessId);
  const branchId = useBusinessStore((s) => s.selectedBranchId);
  const ownedBusinesses = useBusinessStore((s) => s.ownedBusinesses);
  const businessInfo = useBusinessStore((s) => s.businessInfo);

  return useMemo(() => {
    const branchName =
      businessInfo?.branches?.find((branch) => branch.id === branchId)?.name ??
      ownedBusinesses
        .find((business) => business.id === businessId)
        ?.branches?.find((branch) => branch.id === branchId)?.name ??
      '';
    return {
      businessId,
      branchId,
      branchName,
      isPaid: getBranchInsightsMembership(ownedBusinesses, businessId, branchId).isPaid,
    };
  }, [businessId, branchId, ownedBusinesses, businessInfo]);
}
