import { useQuery } from "@tanstack/react-query";
import businessService from "@/http/business-api/business.service";
import { mapNoteDaoToOfferItem, type OfferCardItem } from "@/types/offer";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

async function fetchBusinessOffers(
  businessId: string,
): Promise<OfferCardItem[]> {
  const response = await businessService.fetchBusinessNotes(businessId);

  if (response.error) {
    throw new Error(response.error.message);
  }

  const notes = response.data?.data ?? [];
  return notes.map(mapNoteDaoToOfferItem);
}

export function useBusinessOffers(businessId: string | undefined) {
  const query = useQuery({
    queryKey: ["business-offers", businessId],
    queryFn: () => fetchBusinessOffers(businessId!),
    enabled: Boolean(businessId),
    staleTime: FEED_STALE_TIME_MS,
  });

  return {
    offers: query.data ?? [],
    isLoading: query.isPending && query.data === undefined,
    isRefetching: query.isRefetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
