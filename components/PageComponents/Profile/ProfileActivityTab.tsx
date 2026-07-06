import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AlertCircle, FolderOpen, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ListCard } from "@/components/ui/ListCard";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { SimilarListCard } from "@/components/ui/SimilarListCard";
import {
  useActivityFeed,
  useFollowingLists,
  useSimilarLists,
  useSimilarUsers,
} from "@/hooks/useProfileList";
import { ActivityFeedCard } from "./ActivityFeedCard";
import { ProfileSimilarUserCard } from "./ProfileSimilarUserCard";

interface ProfileActivityTabProps {
  userId: string;
}

function ActivitySection({
  title,
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: {
  title: string;
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <View className="mb-8">
      <Text className="mb-4 font-geist-semibold text-base text-ink dark:text-gray-100">
        {title}
      </Text>
      {loading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#FF6B1A" />
        </View>
      )}
      {error && !loading && (
        <View className="items-center gap-3 py-8">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="font-geist text-sm text-red-500">{t("profile.lists.error")}</Text>
          <LocalNotesButton
            label={t("profile.lists.retry")}
            onPress={onRetry}
            variant="dark"
            size="sm"
            isWidthFull={false}
          />
        </View>
      )}
      {!loading && !error && empty && (
        <View className="items-center gap-2 py-8">
          <FolderOpen size={40} color="#D1D5DB" />
          <Text className="font-geist-medium text-sm text-gray-500 dark:text-gray-400">
            {emptyTitle}
          </Text>
          <Text className="text-center font-geist text-xs text-gray-400 dark:text-gray-500">
            {emptyDescription}
          </Text>
        </View>
      )}
      {!loading && !error && !empty && children}
    </View>
  );
}

export function ProfileActivityTab({ userId }: ProfileActivityTabProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    activityFeed,
    isPending: activityFeedLoading,
    isError: activityFeedError,
    refetch: refetchActivity,
  } = useActivityFeed();

  const {
    followingList,
    isPending: followingListLoading,
    isError: followingError,
    refetch: refetchFollowing,
  } = useFollowingLists();

  const { similarUsers } = useSimilarUsers(userId);
  const { similarList } = useSimilarLists();

  return (
    <View className="p-4">
      <ActivitySection
        title={t("profile.activity.followingLists")}
        loading={followingListLoading}
        error={followingError}
        empty={!followingList.length}
        emptyTitle={t("profile.activity.noFollowingLists")}
        emptyDescription={t("profile.activity.noFollowingListsDescription")}
        onRetry={() => void refetchFollowing()}
      >
        <View className="gap-4">
          {followingList.map((card) => (
            <ListCard key={card.id} data={card} />
          ))}
        </View>
      </ActivitySection>

      <ActivitySection
        title={t("profile.activity.activityFeed")}
        loading={activityFeedLoading}
        error={activityFeedError}
        empty={activityFeed.length === 0}
        emptyTitle={t("profile.activity.emptyFeed")}
        emptyDescription={t("profile.activity.emptyFeedDescription")}
        onRetry={() => void refetchActivity()}
      >
        <View className="divide-y divide-gray-100 dark:divide-gray-800">
          {activityFeed.map((item) => (
            <ActivityFeedCard key={item.id} item={item} />
          ))}
        </View>
      </ActivitySection>

      <View className="mb-4">
        <Text className="mb-4 font-geist-semibold text-base text-ink dark:text-gray-100">
          {t("profile.activity.similarUsers")}
        </Text>
        <View className="gap-2">
          {similarUsers.map((user) => (
            <ProfileSimilarUserCard
              key={user.id}
              id={user.id}
              name={user.name}
              followers={user.followers_count}
              interactions={user.follows_summary}
              listCount={user.num_lists}
              isFollowed={user.is_followed}
            />
          ))}
        </View>
      </View>

      <View>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-geist-semibold text-base text-ink dark:text-gray-100">
            {t("profile.activity.similarLists")}
          </Text>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/home")}
            className="flex-row cursor-pointer items-center gap-1"
          >
            <Sparkles size={14} color="#1D4ED8" />
            <Text className="text-sm text-blue-700 dark:text-blue-400">
              {t("profile.activity.smartPick")}
            </Text>
          </Pressable>
        </View>
        <View className="gap-4">
          {similarList.map((item) => (
            <SimilarListCard key={item.id} {...item} onPress={() => {}} />
          ))}
        </View>
      </View>
    </View>
  );
}
