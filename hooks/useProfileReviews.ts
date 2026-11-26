import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import reviewsService from "@/http/reviews-api/reviews.service";
import type {
  GoogleConnectDTO,
  ProfileLinkProviderId,
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

function useInvalidateAfterLink() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["review-connections"] }),
      queryClient.invalidateQueries({ queryKey: ["reviews"] }),
      queryClient.invalidateQueries({ queryKey: ["reviews-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["profile"] }),
    ]);
  }, [queryClient]);
}

export function useStartProfileLink() {
  const invalidate = useInvalidateAfterLink();
  return useMutation({
    mutationFn: async (vars: {
      provider: ProfileLinkProviderId;
      profileUrl: string;
    }) => {
      const response = await reviewsService.startProfileLink(vars.provider, {
        profile_url: vars.profileUrl,
      });
      if (response.error) {
        throw new Error(response.error.message || "Failed to start linking");
      }
      return response.data?.data;
    },
    onSuccess: invalidate,
  });
}

export function useVerifyProfileLink() {
  const invalidate = useInvalidateAfterLink();
  return useMutation({
    mutationFn: async (provider: ProfileLinkProviderId) => {
      const response = await reviewsService.verifyProfileLink(provider);
      if (response.error) {
        throw new Error(response.error.message || "Verification failed");
      }
      return response.data?.data;
    },
    onSuccess: invalidate,
  });
}

export function useDisconnectProvider() {
  const invalidate = useInvalidateAfterLink();
  return useMutation({
    mutationFn: async (provider: ProfileLinkProviderId) => {
      const response = await reviewsService.disconnectProvider(provider);
      if (response.error) {
        throw new Error(response.error.message || "Failed to disconnect");
      }
      return response.data?.data;
    },
    onSuccess: invalidate,
  });
}

export function useSyncReviews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider?: ReviewProviderId) => {
      const response = await reviewsService.syncReviews(provider ?? "google");
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
