import { create } from 'zustand';
import businessService from '@/http/business-api/business.service';
import type { BusinessItemDAO } from '@/http/business-api/types';

interface BusinessState {
  businessInfo: BusinessItemDAO | null;
  businessId: string;
  isFetching: boolean;
  hasFetched: boolean;
  loadBusinessInfo: () => Promise<void>;
  reset: () => void;
}

let inflightRequest: Promise<void> | null = null;

export const useBusinessStore = create<BusinessState>((set, get) => ({
  businessInfo: null,
  businessId: '',
  isFetching: false,
  hasFetched: false,

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
            isFetching: false,
            hasFetched: true,
          });
          return;
        }
        set({
          businessInfo: data.data,
          businessId: data.data.id ?? '',
          isFetching: false,
          hasFetched: true,
        });
      })
      .catch(() => {
        set({
          businessInfo: null,
          businessId: '',
          isFetching: false,
          hasFetched: true,
        });
      })
      .finally(() => {
        inflightRequest = null;
      });

    return inflightRequest;
  },

  reset: () => {
    inflightRequest = null;
    set({
      businessInfo: null,
      businessId: '',
      isFetching: false,
      hasFetched: false,
    });
  },
}));
