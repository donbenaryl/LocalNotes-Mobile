import { create } from 'zustand';
import businessService from '@/http/business-api/business.service';
import type { BusinessItemDAO, OwnedBusinessDAO } from '@/http/business-api/types';

function firstBranchId(
  business?: { branches?: { id: string }[] } | null,
): string | null {
  return business?.branches?.[0]?.id ?? null;
}

function validBranchId(
  business: { branches?: { id: string }[] } | null | undefined,
  branchId: string | null,
): string | null {
  if (branchId && business?.branches?.some((branch) => branch.id === branchId)) {
    return branchId;
  }
  return firstBranchId(business);
}

interface BusinessState {
  businessInfo: BusinessItemDAO | null;
  businessId: string;
  ownedBusinesses: OwnedBusinessDAO[];
  selectedBranchId: string | null;
  isFetching: boolean;
  hasFetched: boolean;
  isFetchingOwned: boolean;
  hasFetchedOwned: boolean;
  ownedError: string | null;
  loadBusinessInfo: () => Promise<void>;
  refreshBusinessInfo: () => Promise<void>;
  loadOwnedBusinesses: () => Promise<void>;
  selectBusiness: (businessId: string) => Promise<{ ok: boolean; message?: string }>;
  selectBranch: (branchId: string | null) => void;
  reset: () => void;
}

let inflightRequest: Promise<void> | null = null;
let inflightOwnedRequest: Promise<void> | null = null;
let ownedRequestId = 0;

const emptyState = {
  businessInfo: null as BusinessItemDAO | null,
  businessId: '',
  ownedBusinesses: [] as OwnedBusinessDAO[],
  selectedBranchId: null as string | null,
  isFetching: false,
  hasFetched: false,
  isFetchingOwned: false,
  hasFetchedOwned: false,
  ownedError: null as string | null,
};

export const useBusinessStore = create<BusinessState>((set, get) => ({
  ...emptyState,

  loadBusinessInfo: () => {
    if (get().hasFetched) return Promise.resolve();
    if (inflightRequest) return inflightRequest;

    set({ isFetching: true });
    inflightRequest = businessService
      .getBusinessInfo()
      .then(({ data, error }) => {
        if (error || !data?.data) {
          set({
            businessInfo: null,
            businessId: '',
            selectedBranchId: null,
            isFetching: false,
            hasFetched: true,
          });
          return;
        }
        set({
          businessInfo: data.data,
          businessId: data.data.id ?? '',
          selectedBranchId: validBranchId(data.data, get().selectedBranchId),
          isFetching: false,
          hasFetched: true,
        });
      })
      .catch(() => {
        set({
          businessInfo: null,
          businessId: '',
          selectedBranchId: null,
          isFetching: false,
          hasFetched: true,
        });
      })
      .finally(() => {
        inflightRequest = null;
      });

    return inflightRequest;
  },

  refreshBusinessInfo: () => {
    inflightRequest = null;
    set({ hasFetched: false });
    return get().loadBusinessInfo();
  },

  loadOwnedBusinesses: () => {
    const requestId = ++ownedRequestId;
    set({ isFetchingOwned: true, ownedError: null });
    inflightOwnedRequest = businessService
      .fetchOwnedBusinesses()
      .then(({ data, error }) => {
        if (requestId !== ownedRequestId) return;
        if (error || !data?.data) {
          set({
            ownedBusinesses: [],
            isFetchingOwned: false,
            hasFetchedOwned: true,
            ownedError: error?.message ?? 'Could not load businesses',
          });
          return;
        }
        const owned = data.data;
        const current =
          owned.find((item) => item.id === get().businessId) ??
          owned.find((item) => item.is_primary) ??
          owned[0];
        set({
          ownedBusinesses: owned,
          isFetchingOwned: false,
          hasFetchedOwned: true,
          ownedError: null,
          selectedBranchId: validBranchId(current, get().selectedBranchId),
        });
      })
      .catch(() => {
        if (requestId !== ownedRequestId) return;
        set({
          ownedBusinesses: [],
          isFetchingOwned: false,
          hasFetchedOwned: true,
          ownedError: 'Could not load businesses',
        });
      })
      .finally(() => {
        if (requestId === ownedRequestId) {
          inflightOwnedRequest = null;
        }
      });

    return inflightOwnedRequest;
  },

  selectBusiness: async (businessId) => {
    if (get().businessId === businessId) {
      return { ok: true };
    }

    const { data, error } = await businessService.setPrimaryBusiness(businessId);
    if (error || !data?.data) {
      return { ok: false, message: error?.message };
    }

    const owned = data.data;
    const selected =
      owned.find((item) => item.id === businessId) ??
      owned.find((item) => item.is_primary) ??
      null;

    ownedRequestId += 1;
    inflightOwnedRequest = null;

    set({
      ownedBusinesses: owned,
      businessId,
      selectedBranchId: firstBranchId(selected),
      hasFetchedOwned: true,
      ownedError: null,
      isFetchingOwned: false,
    });

    const info = await businessService.getBusinessInfo();
    if (!info.error && info.data?.data) {
      set({
        businessInfo: info.data.data,
        businessId: info.data.data.id ?? businessId,
        selectedBranchId: validBranchId(info.data.data, get().selectedBranchId),
        hasFetched: true,
        isFetching: false,
      });
    } else {
      set({ hasFetched: true, isFetching: false });
    }

    return { ok: true };
  },

  selectBranch: (branchId) => {
    set({ selectedBranchId: branchId });
  },

  reset: () => {
    inflightRequest = null;
    inflightOwnedRequest = null;
    ownedRequestId += 1;
    set(emptyState);
  },
}));
