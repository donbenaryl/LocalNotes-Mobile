import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import type { FollowListUserDAO } from "@/http/account-api/types";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

export type FollowListTab = "followers" | "following";

export const followersQueryKey = (userId: string) =>
  ["followers", userId] as const;
export const followingQueryKey = (userId: string) =>
  ["following", userId] as const;

type FollowListPage = {
  items: FollowListUserDAO[];
  next: number | null;
};

async function fetchFollowListPage(
  tab: FollowListTab,
  userId: string,
  page: number,
): Promise<FollowListPage> {
  const response =
    tab === "followers"
      ? await accountService.fetchFollowers(userId, page)
      : await accountService.fetchFollowing(userId, page);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return {
    items: response.data?.data ?? [],
    next: response.data?.pagination?.next ?? null,
  };
}

export function useFollowList(
  userId: string,
  tab: FollowListTab,
  enabled: boolean,
) {
  const queryKey =
    tab === "followers"
      ? followersQueryKey(userId)
      : followingQueryKey(userId);

  const query = useInfiniteQuery({
    queryKey,
    enabled: enabled && Boolean(userId),
    queryFn: ({ pageParam }) => fetchFollowListPage(tab, userId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.next ?? undefined,
    staleTime: FEED_STALE_TIME_MS,
  });

  const users = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  return {
    users,
    isPending: query.isPending,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
