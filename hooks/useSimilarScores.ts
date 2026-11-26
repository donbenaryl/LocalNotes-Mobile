import { useQuery } from "@tanstack/react-query";
import recommendationsService from "@/http/recommendations-api/recommendations.service";
import type { similarUserScore } from "@/http/recommendations-api/types";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";
import { getMatchPercentFromSimilarity } from "@/utils/matchScore";

export { getMatchPercentFromSimilarity } from "@/utils/matchScore";

export function useSimilarScores(userId: string, enabled = true) {
  const shouldFetch = enabled && Boolean(userId);

  const { data, isPending, isError } = useQuery({
    queryKey: ["similar-scores", userId],
    enabled: shouldFetch,
    staleTime: FEED_STALE_TIME_MS,
    queryFn: async (): Promise<similarUserScore | null> => {
      const response = await recommendationsService.fetchSimilarScores(userId);
      return response.data?.data ?? null;
    },
  });

  const similarScores = data ?? undefined;
  const tasteMatchBlurb =
    similarScores?.reason?.reasons?.find((r) => Boolean(r?.message))?.message ??
    null;

  return {
    similarScores,
    matchPercent: getMatchPercentFromSimilarity(similarScores ?? null),
    tasteMatchBlurb,
    isLoading: isPending,
    isError,
  };
}
