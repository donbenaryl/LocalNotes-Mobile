import { useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { NEARBY_USERS_RADIUS_KM, useNearbyUsers } from "@/hooks/useNearbyUsers";
import accountService from "@/http/account-api/account.services";
import { ConnectNowUserRow } from "./ConnectNowUserRow";

interface ConnectNowModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ConnectNowModal({ visible, onClose }: ConnectNowModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { users, isLoading, error, locationError } = useNearbyUsers();
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

      void queryClient.invalidateQueries({ queryKey: ["followers"] });
      void queryClient.invalidateQueries({ queryKey: ["following"] });
      void queryClient.invalidateQueries({ queryKey: ["nearbyUsers"] });

      if (succeeded === 0) {
        toast.error(t("home.following.findFriends.connectNowModal.followAllError"));
        return;
      }
      toast.success(
        t("home.following.findFriends.connectNowModal.followAllSuccess", {
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
    const message = locationError
      ? t("home.following.findFriends.connectNowModal.locationError")
      : error
        ? t("home.following.findFriends.connectNowModal.loadError")
        : t("home.following.findFriends.connectNowModal.empty", {
            radius: NEARBY_USERS_RADIUS_KM,
          });
    return (
      <Text className="py-10 text-center font-geist text-sm text-gray-500 dark:text-gray-400">
        {message}
      </Text>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("home.following.findFriends.connectNowModal.title")}
      sheetHeightRatio={0.9}
      footer={
        <LocalNotesButton
          label={t("home.following.findFriends.connectNowModal.followAll")}
          onPress={() => void handleFollowAll()}
          disabled={users.length === 0}
          loading={isFollowingAll}
          variant="brand"
        />
      }
    >
      <Text className="-mt-2 mb-2 font-geist text-sm text-gray-500 dark:text-gray-400">
        {t("home.following.findFriends.connectNowModal.subtitle", {
          radius: NEARBY_USERS_RADIUS_KM,
        })}
      </Text>
      <FlatList
        className="flex-1"
        data={users}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => <ConnectNowUserRow user={item} />}
        ListEmptyComponent={renderStatus}
        showsVerticalScrollIndicator={false}
      />
    </Modal>
  );
}
