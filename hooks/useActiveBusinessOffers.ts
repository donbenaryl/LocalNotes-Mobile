import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { NoteDAO } from '@/http/notes-api/types';
import { FEED_STALE_TIME_MS } from '@/constants/queryCache';

/**
 * An offer is "active" when it is a published note whose billing is active and
 * which has not expired. Mirrors the backend consumer-feed rule. Redeemability
 * is an optional toggle, so it is not part of the rule.
 */
export function isOfferActive(note: NoteDAO, now: Date = new Date()): boolean {
  if (note.status !== 'published') return false;
  if (note.billing_status !== 'active') return false;
  if (note.expires_at && new Date(note.expires_at) <= now) return false;
  return true;
}

async function fetchActiveBusinessOffers(businessId: string): Promise<NoteDAO[]> {
  const response = await businessService.fetchBusinessNotes(businessId);

  if (response.error) {
    throw new Error(response.error.message);
  }

  const now = new Date();
  return (response.data?.data ?? []).filter((note) => isOfferActive(note, now));
}

export function useActiveBusinessOffers(businessId: string | undefined) {
  const query = useQuery({
    queryKey: ['business-active-offers', businessId],
    queryFn: () => fetchActiveBusinessOffers(businessId!),
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
