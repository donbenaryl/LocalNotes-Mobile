import { useCallback, useEffect, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import type { profileItemDAO } from "@/http/account-api/types";

function patchProfileFollowCache(
  queryClient: QueryClient,
  userId: string,
  nextIsFollowed: boolean,
) {
  queryClient.setQueryData<profileItemDAO | null>(
    ["profile", userId],
    (old) => {
      if (!old) return old;
      if (Boolean(old.is_followed) === nextIsFollowed) return old;

      const prevCount = Number(old.followers_count) || 0;
      return {
        ...old,
        is_followed: nextIsFollowed,
        followers_count: Math.max(
          0,
          prevCount + (nextIsFollowed ? 1 : -1),
        ),
      };
    },
  );
}

export function useUserFollow(userId: string, initialIsFollowed: boolean) {
  const queryClient = useQueryClient();
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowed(initialIsFollowed);
  }, [initialIsFollowed]);

  const toggle = useCallback(async () => {
    if (!userId || isLoading) return;

    const previousIsFollowed = isFollowed;
    const nextIsFollowed = !previousIsFollowed;
    const previousProfile = queryClient.getQueryData<profileItemDAO | null>([
      "profile",
      userId,
    ]);

    setIsLoading(true);
    setIsFollowed(nextIsFollowed);
    patchProfileFollowCache(queryClient, userId, nextIsFollowed);

    try {
      if (previousIsFollowed) {
        await accountService.unfollowUser(userId);
      } else {
        await accountService.followUser(userId);
      }
    } catch (error) {
      console.error(`Failed to toggle follow for user ${userId}:`, error);
      setIsFollowed(previousIsFollowed);
      if (previousProfile !== undefined) {
        queryClient.setQueryData(["profile", userId], previousProfile);
      } else {
        patchProfileFollowCache(queryClient, userId, previousIsFollowed);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isFollowed, isLoading, queryClient, userId]);

  return { isFollowed, isLoading, toggle };
}
