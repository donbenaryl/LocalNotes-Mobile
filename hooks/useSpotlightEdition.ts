import { useQuery } from "@tanstack/react-query";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import type { SpotlightEditionDAO } from "@/http/spotlight-api/type";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

async function fetchSpotlightEdition(city?: string): Promise<SpotlightEditionDAO | null> {
  const response = await spotlightService.fetchEdition(city ? { city } : undefined);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.data ?? null;
}

export function useSpotlightEdition(city?: string, enabled = true) {
  const editionQuery = useQuery({
    queryKey: ["spotlight-edition", city],
    queryFn: () => fetchSpotlightEdition(city),
    staleTime: FEED_STALE_TIME_MS,
    enabled,
  });

  return {
    data: editionQuery.data ?? null,
    isLoading: editionQuery.isPending && editionQuery.data === undefined,
    isRefetching: editionQuery.isRefetching,
    error: editionQuery.error?.message ?? null,
    refetch: async () => {
      await editionQuery.refetch();
    },
  };
}
