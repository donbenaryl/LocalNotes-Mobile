import { useCallback } from "react";
import {
  useActivityFeed,
  useFollowingLists,
  useSimilarLists,
  useSimilarUsers,
} from "@/hooks/useProfileList";

/** Combined activity, following, and similar feeds for the recent-activity screen. */
export function useProfileActivityData(userId: string) {
  const activity = useActivityFeed();
  const following = useFollowingLists();
  const similarUsers = useSimilarUsers(userId);
  const similarLists = useSimilarLists();

  const refetchAll = useCallback(() => {
    void Promise.all([
      activity.refetch(),
      following.refetch(),
      similarUsers.refetch(),
      similarLists.refetch(),
    ]);
  }, [
    activity.refetch,
    following.refetch,
    similarUsers.refetch,
    similarLists.refetch,
  ]);

  const isRefetching =
    activity.isRefetching ||
    following.isRefetching ||
    similarUsers.isRefetching ||
    similarLists.isRefetching;

  return {
    activityFeed: activity.activityFeed,
    activityFeedLoading: activity.isPending,
    activityFeedError: activity.isError,
    refetchActivity: activity.refetch,
    followingList: following.followingList,
    followingListLoading: following.isPending,
    followingError: following.isError,
    refetchFollowing: following.refetch,
    similarUsers: similarUsers.similarUsers,
    similarList: similarLists.similarList,
    refetchAll,
    isRefetching,
  };
}
