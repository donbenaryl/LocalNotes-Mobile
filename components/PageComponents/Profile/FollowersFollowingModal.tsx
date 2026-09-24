import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  useFollowList,
  type FollowListTab,
} from "@/hooks/useFollowList";
import { useUserFollow } from "@/hooks/useUserFollow";
import type { FollowListUserDAO } from "@/http/account-api/types";
import { resolveImageUrl } from "@/utils/httpHelpers";

function formatFollowerCount(value: number | undefined): string {
  const n = value ?? 0;
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const thousands = n / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  return String(Math.round(n));
}

interface FollowListRowProps {
  user: FollowListUserDAO;
  tab: FollowListTab;
  isOwnProfile: boolean;
  onNavigate: (userId: string) => void;
}

function FollowListRow({
  user,
  tab,
  isOwnProfile,
  onNavigate,
}: FollowListRowProps) {
  const { t } = useTranslation();
  const { isFollowed, isLoading, toggle } = useUserFollow(
    user.id,
    Boolean(user.is_followed),
  );

  const subtitle = t("search.people.followersCount", {
    count: formatFollowerCount(user.followers_count),
  });

  const showFollowBack = tab === "followers" && !isFollowed;
  const showFollowingAction = tab === "following";

  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <Pressable
        onPress={() => onNavigate(user.id)}
        accessibilityRole="button"
        className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-70"
      >
        <Avatar
          name={user.name}
          src={resolveImageUrl(user.profile_image_url) ?? undefined}
          size="md"
        />
        <View className="min-w-0 flex-1">
          <Text
            className="font-geist-semibold text-[15px] text-ink dark:text-gray-100"
            numberOfLines={1}
          >
            {user.name}
          </Text>
          <Text
            className="mt-0.5 font-geist text-[13px] text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </Pressable>

      {showFollowBack ? (
        <Pressable
          onPress={() => void toggle()}
          disabled={isLoading}
          accessibilityRole="button"
          hitSlop={8}
          className="active:opacity-70"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FF6B1A" />
          ) : (
            <Text className="font-geist-bold text-[13px] text-brand">
              {isOwnProfile
                ? t("profile.followList.followBack")
                : t("profile.followList.follow")}
            </Text>
          )}
        </Pressable>
      ) : null}

      {showFollowingAction ? (
        <Pressable
          onPress={() => void toggle()}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityState={{ selected: isFollowed, busy: isLoading }}
          hitSlop={8}
          className="active:opacity-70"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <Text className="font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400">
              {isFollowed
                ? t("profile.lists.following")
                : t("profile.followList.follow")}
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

interface FollowersFollowingModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialTab: FollowListTab;
  isOwnProfile?: boolean;
}

export function FollowersFollowingModal({
  visible,
  onClose,
  userId,
  initialTab,
  isOwnProfile = false,
}: FollowersFollowingModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<FollowListTab>(initialTab);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const tabs: TabItem[] = useMemo(
    () => [
      { id: "followers", label: t("profile.info.stats.followers") },
      { id: "following", label: t("profile.info.stats.following") },
    ],
    [t],
  );

  const {
    users,
    isPending,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useFollowList(userId, activeTab, visible);

  const handleNavigate = (targetUserId: string) => {
    onClose();
    router.push(`/profile/${targetUserId}`);
  };

  const emptyMessage =
    activeTab === "followers"
      ? t("profile.followList.emptyFollowers")
      : t("profile.followList.emptyFollowing");

  return (
    <Modal visible={visible} onClose={onClose} position="fullscreen">
      <View className="flex-1 bg-page dark:bg-gray-900">
        <PageHeader onBack={onClose} borderless />
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as FollowListTab)}
          equalWidth
          className="mx-4"
        />

        {isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6">
            <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
              {t("profile.followList.loadError")}
            </Text>
            <Pressable
              onPress={() => void refetch()}
              className="active:opacity-70"
            >
              <Text className="font-geist-semibold text-sm text-brand">
                {t("common.continue")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FollowListRow
                user={item}
                tab={activeTab}
                isOwnProfile={isOwnProfile}
                onNavigate={handleNavigate}
              />
            )}
            contentContainerClassName={
              users.length === 0 ? "flex-1 justify-center px-6" : "pb-10"
            }
            // RefreshControl blanks flex FlatLists on Android.
            refreshControl={
              Platform.OS === "android" ? undefined : (
                <AppRefreshControl
                  refreshing={isRefetching && !isFetchingNextPage}
                  onRefresh={() => {
                    void refetch();
                  }}
                />
              )
            }
            ListEmptyComponent={
              <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </Text>
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}
