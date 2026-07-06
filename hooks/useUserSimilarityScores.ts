import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import recommendationsService from "@/http/recommendations-api/recommendations.service";
import {
  getMatchPercentFromSimilarity,
} from "@/hooks/useSimilarScores";

interface UseUserSimilarityScoresOptions {
  accountIds: string[];
  currentUserId?: string;
  enabled?: boolean;
}

export function useUserSimilarityScores({
  accountIds,
  currentUserId,
  enabled = true,
}: UseUserSimilarityScoresOptions) {
  const uniqueIds = useMemo(() => {
    const seen = new Set<string>();
    for (const id of accountIds) {
      if (!id || id === currentUserId) continue;
      seen.add(id);
    }
    return [...seen];
  }, [accountIds, currentUserId]);

  const queries = useQueries({
    queries: uniqueIds.map((userId) => ({
      queryKey: ["similar-scores", userId] as const,
      enabled: enabled && Boolean(userId),
      queryFn: async () => {
        const response = await recommendationsService.fetchSimilarScores(userId);
        return response.data?.data ?? null;
      },
    })),
  });

  const matchByAccountId = useMemo(() => {
    const map: Record<string, number> = {};

    queries.forEach((query, index) => {
      const userId = uniqueIds[index];
      const matchPercent = getMatchPercentFromSimilarity(query.data);
      if (userId && matchPercent != null) {
        map[userId] = matchPercent;
      }
    });

    return map;
  }, [queries, uniqueIds]);

  const isLoading = queries.some((query) => query.isPending);

  return {
    matchByAccountId,
    isLoading,
  };
}
