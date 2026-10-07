import { useState, type ReactNode } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import accountService from "@/http/account-api/account.services";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { FindFriendsUserRow } from "./FindFriendsUserRow";

const BASE_INVALIDATE_KEYS: QueryKey[] = [["followers"], ["following"]];

interface FindFriendsUsersModalProps<T extends UnifiedSearchPersonDAO> {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  users: T[];
  isLoading: boolean;
  /** Shown when the list is empty and not loading. */
  statusMessage: string;
  /** Optional action rendered under `statusMessage` (e.g. "Open Settings"). */
  statusAction?: ReactNode;
  /** Rendered above the list, below the subtitle. */
  headerContent?: ReactNode;
  renderSubtitle?: (user: T) => { text: string; icon?: ReactNode } | undefined;
  /** Extra query keys to refresh after "Follow All" (followers/following are always refreshed). */
  invalidateKeys?: QueryKey[];
}

export function FindFriendsUsersModal<T extends UnifiedSearchPersonDAO>({
  visible,
  onClose,
  title,
  subtitle,
  users,
  isLoading,
  statusMessage,
  statusAction,
  headerContent,
  renderSubtitle,
  invalidateKeys = [],
}: FindFriendsUsersModalProps<T>) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isFollowingAll, setIsFollowingAll] = useState(false);

  const handleFollowAll = async () => {
    if (isFollowingAll || users.length === 0) return;
    setIsFollowingAll(true);
    try {
      const results = await Promise.allSettled(
        users.map((user) => accountService.followUser(user.id)),
      );
      const succeeded = results.filter(
        (result) => result.status === "fulfilled" && !result.value.error,
      ).length;

      for (const queryKey of [...BASE_INVALIDATE_KEYS, ...invalidateKeys]) {
        void queryClient.invalidateQueries({ queryKey });
      }

      if (succeeded === 0) {
        toast.error(t("home.following.findFriends.usersModal.followAllError"));
        return;
      }
      toast.success(
        t("home.following.findFriends.usersModal.followAllSuccess", {
          count: succeeded,
        }),
      );
      onClose();
    } finally {
      setIsFollowingAll(false);
    }
  };

  const renderStatus = () => {
    if (isLoading) {
      return (
        <View className="items-center py-10">
          <ActivityIndicator size="small" color="#FF6B1A" />
        </View>
      );
    }
    return (
      <View className="items-center gap-4 py-10">
        <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
          {statusMessage}
        </Text>
        {statusAction}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      sheetHeightRatio={0.9}
      footer={
        <LocalNotesButton
          label={t("home.following.findFriends.usersModal.followAll")}
          onPress={() => void handleFollowAll()}
          disabled={users.length === 0}
          loading={isFollowingAll}
          variant="brand"
        />
      }
    >
      <FlatList
        className="flex-1 mb-[80px] pt-2"
        data={users}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => {
          const custom = renderSubtitle?.(item);
          return (
            <FindFriendsUserRow
              user={item}
              subtitle={custom?.text}
              subtitleIcon={custom?.icon}
            />
          );
        }}
        ListHeaderComponent={
          subtitle || headerContent ? (
            <View className="-mt-2 mb-2 gap-3">
              {subtitle ? (
                <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </Text>
              ) : null}
              {headerContent}
            </View>
          ) : null
        }
        ListEmptyComponent={renderStatus}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </Modal>
  );
}
