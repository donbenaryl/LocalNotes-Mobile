import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import reviewsService from "@/http/reviews-api/reviews.service";
import type {
  GoogleConnectDTO,
  ReviewProviderId,
} from "@/http/reviews-api/types";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

export function useReviewConnections(enabled = true) {
  return useQuery({
    queryKey: ["review-connections"],
    queryFn: async () => {
      const response = await reviewsService.fetchConnections();
      return response.data?.data ?? [];
    },
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });
}

export function useReviewSummary(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["reviews-summary", userId],
    queryFn: async () => {
      const response = await reviewsService.fetchSummary(
        userId ? { user_id: userId } : undefined,
      );
      return (
        response.data?.data ?? {
          total: 0,
          by_provider: {
            google: 0,
            yelp: 0,
            amazon: 0,
            tripadvisor: 0,
          },
        }
      );
    },
    enabled: enabled && Boolean(userId),
    staleTime: FEED_STALE_TIME_MS,
  });
}

export function useProfileReviews(
  userId: string,
  provider: ReviewProviderId | "all",
  enabled = true,
) {
  return useQuery({
    queryKey: ["reviews", userId, provider],
    queryFn: async () => {
      const response = await reviewsService.fetchReviews({
        user_id: userId,
        provider: provider === "all" ? undefined : provider,
      });
      return response.data?.data ?? [];
    },
    enabled: enabled && Boolean(userId),
    staleTime: FEED_STALE_TIME_MS,
  });
}

export function useConnectGoogleReviews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: GoogleConnectDTO) => {
      const response = await reviewsService.connectGoogle(body);
      if (response.error) {
        throw new Error(response.error.message || "Failed to connect Google");
      }
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["review-connections"] }),
        queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["reviews-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
  });
}

export function useDisconnectGoogleReviews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await reviewsService.disconnectGoogle();
      if (response.error) {
        throw new Error(response.error.message || "Failed to disconnect Google");
      }
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["review-connections"] }),
        queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["reviews-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
  });
}

export function useSyncReviews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await reviewsService.syncReviews();
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["review-connections"] }),
        queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["reviews-summary"] }),
      ]);
    },
  });
}

export function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["review-connections"] }),
      queryClient.invalidateQueries({ queryKey: ["reviews"] }),
      queryClient.invalidateQueries({ queryKey: ["reviews-summary"] }),
    ]);
  }, [queryClient]);
}
