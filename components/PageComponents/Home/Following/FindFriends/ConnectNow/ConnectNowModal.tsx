import { useTranslation } from "react-i18next";
import { NEARBY_USERS_RADIUS_KM, useNearbyUsers } from "@/hooks/useNearbyUsers";
import { FindFriendsUsersModal } from "../shared/FindFriendsUsersModal";

interface ConnectNowModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ConnectNowModal({ visible, onClose }: ConnectNowModalProps) {
  const { t } = useTranslation();
  const { users, isLoading, error, locationError } = useNearbyUsers();

  const statusMessage = locationError
    ? t("home.following.findFriends.connectNowModal.locationError")
    : error
      ? t("home.following.findFriends.connectNowModal.loadError")
      : t("home.following.findFriends.connectNowModal.empty", {
          radius: NEARBY_USERS_RADIUS_KM,
        });

  return (
    <FindFriendsUsersModal
      visible={visible}
      onClose={onClose}
      title={t("home.following.findFriends.connectNowModal.title")}
      subtitle={t("home.following.findFriends.connectNowModal.subtitle", {
        radius: NEARBY_USERS_RADIUS_KM,
      })}
      users={users}
      isLoading={isLoading}
      statusMessage={statusMessage}
      invalidateKeys={[["nearbyUsers"]]}
    />
  );
}
