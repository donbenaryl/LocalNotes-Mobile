import { useQuery } from "@tanstack/react-query";
import recommendationsService from "@/http/recommendations-api/recommendations.service";
import type { similarUserScore } from "@/http/recommendations-api/types";

export function getMatchPercentFromSimilarity(
  score: similarUserScore | null | undefined,
): number | null {
  if (score?.reason?.overall_score === undefined) return null;
  return Math.round(score.reason.overall_score);
}

export function useSimilarScores(userId: string, enabled = true) {
  const shouldFetch = enabled && Boolean(userId);

  const { data, isPending, isError } = useQuery({
    queryKey: ["similar-scores", userId],
    enabled: shouldFetch,
    queryFn: async (): Promise<similarUserScore | null> => {
      const response = await recommendationsService.fetchSimilarScores(userId);
      return response.data?.data ?? null;
    },
  });

  return {
    similarScores: data ?? undefined,
    isLoading: isPending,
    isError,
  };
}
