import { useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import { useRegisterSectionPullToRefresh } from "@/components/ui/SectionPullToRefreshContext";
import { AlertCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { ActivityItemDAO } from "@/http/home-api/type";
import { FollowingActivityRow } from "@/components/PageComponents/Home/Following/FollowingActivityRow";
import { FollowingFreshPerspectives } from "@/components/PageComponents/Home/Following/FollowingFreshPerspectives";
import { FollowingListCard } from "@/components/PageComponents/Home/Following/FollowingListCard";
import { FollowingListSkeleton } from "@/components/PageComponents/Home/Following/FollowingListSkeleton";
import { FollowingPickCard } from "@/components/PageComponents/Home/Following/FollowingPickCard";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { useActivityFeed, useSimilarUsers } from "@/hooks/useProfileList";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/utils/cn";
import { isListActivity, isPickActivity } from "@/utils/followingFeed";
import { getFeedTimeGroup, type FeedTimeGroup } from "@/utils/time";

interface ActivityGroup {
  group: FeedTimeGroup;
  items: ActivityItemDAO[];
}

function groupActivityByTime(items: ActivityItemDAO[], locale: string): ActivityGroup[] {
  const now = new Date();
  const groups: ActivityGroup[] = [];
  for (const item of items) {
    const group = getFeedTimeGroup(item.created_at, now, locale);
    const last = groups[groups.length - 1];
    if (last && last.group.id === group.id) {
      last.items.push(item);
    } else {
      groups.push({ group, items: [item] });
    }
  }
  return groups;
}

function FollowingActivityItem({ item }: { item: ActivityItemDAO }) {
  if (isListActivity(item)) return <FollowingListCard item={item} />;
  if (isPickActivity(item)) return <FollowingPickCard item={item} />;
  return <FollowingActivityRow item={item} />;
}

export function FollowingTab() {
  const { t, i18n } = useTranslation();
  const currentUserId = useAuthStore((state) => state.user?.id) ?? "";

  const {
    activityFeed,
    isPending: activityLoading,
    isError: activityError,
    isRefetching: activityRefetching,
    refetch: refetchActivity,
  } = useActivityFeed();

  const {
    similarUsers,
    isPending: similarPending,
    isError: similarError,
    isRefetching: similarRefetching,
    refetch: refetchSimilar,
  } = useSimilarUsers(currentUserId);

  const isRefetching = activityRefetching || similarRefetching;

  const handleRefresh = useCallback(() => {
    void Promise.all([refetchActivity(), currentUserId ? refetchSimilar() : null]);
  }, [refetchActivity, refetchSimilar, currentUserId]);

  useRegisterSectionPullToRefresh("following", handleRefresh, isRefetching);

  const groups = useMemo(
    () => groupActivityByTime(activityFeed, i18n.language),
    [activityFeed, i18n.language],
  );

  return (
    <View className="px-4 pt-2">
      {activityLoading && <FollowingListSkeleton />}

      {activityError && !activityLoading && (
        <View className="items-center gap-3 py-8">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="font-geist text-sm text-red-500">
            {t("profile.lists.error")}
          </Text>
          <LocalNotesButton
            label={t("profile.lists.retry")}
            onPress={() => void refetchActivity()}
            variant="dark"
            size="sm"
            isWidthFull={false}
          />
        </View>
      )}

      {!activityLoading && !activityError && activityFeed.length === 0 && (
        <EmptyScreen
          title={t("home.following.noActivity")}
          description={t("home.following.noActivityDescription")}
        />
      )}

      {!activityLoading && !activityError && groups.length > 0 && (
        <View className="gap-6">
          {groups.map(({ group, items }) => (
            <View key={`${group.id}-${items[0].id}`}>
              <Text className="font-geist-semibold text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {t(group.i18nKey, group.params)}
              </Text>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  className={cn(
                    "py-4",
                    index < items.length - 1 && "border-b border-gray-100 dark:border-gray-800",
                  )}
                >
                  <FollowingActivityItem item={item} />
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <FollowingFreshPerspectives
        users={similarUsers}
        isLoading={Boolean(currentUserId) && similarPending}
        isError={similarError}
      />
    </View>
  );
}
