import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import notesService from "@/http/notes-api/notes.service";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { mapNoteDaoToOfferItem, type OfferCardItem } from "@/types/offer";

const NEAR_YOU_RADIUS_KM = 5;
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export interface OffersSections {
  expiringSoon: OfferCardItem[];
  followed: OfferCardItem[];
  nearYou: OfferCardItem[];
  other: OfferCardItem[];
}

async function fetchOffersFeed(
  latitude?: number,
  longitude?: number,
): Promise<OfferCardItem[]> {
  const query =
    latitude !== undefined && longitude !== undefined
      ? { latitude, longitude, radius_km: NEAR_YOU_RADIUS_KM }
      : undefined;

  const response = await notesService.fetchFeed(query);

  if (response.error) {
    throw new Error(response.error.message);
  }

  const notes = response.data?.data ?? [];
  return notes.map(mapNoteDaoToOfferItem);
}

function isExpiringSoon(offer: OfferCardItem): boolean {
  if (!offer.expiresAt) return false;
  const diff = new Date(offer.expiresAt).getTime() - Date.now();
  return diff > 0 && diff <= TWO_DAYS_MS;
}

function groupOffers(offers: OfferCardItem[]): OffersSections {
  const expiringSoon = offers.filter(isExpiringSoon);
  const followed = offers.filter((offer) => offer.isBusinessFollowed);
  const nearYou = offers.filter(
    (offer) => offer.businessBranches && offer.businessBranches.length > 0,
  );

  const categorizedIds = new Set([
    ...expiringSoon.map((offer) => offer.id),
    ...followed.map((offer) => offer.id),
    ...nearYou.map((offer) => offer.id),
  ]);

  const other = offers.filter((offer) => !categorizedIds.has(offer.id));

  return { expiringSoon, followed, nearYou, other };
}

export function useOffersFeed() {
  const { coordinates } = useUserCoordinates();

  const feedQuery = useQuery({
    queryKey: [
      "offers-feed",
      coordinates?.latitude,
      coordinates?.longitude,
    ],
    queryFn: () =>
      fetchOffersFeed(coordinates?.latitude, coordinates?.longitude),
  });

  const offers = feedQuery.data ?? [];

  const sections = useMemo(() => groupOffers(offers), [offers]);

  return {
    sections,
    totalCount: offers.length,
    isLoading: feedQuery.isPending,
    error: feedQuery.error?.message ?? null,
    refetch: async () => {
      await feedQuery.refetch();
    },
  };
}
