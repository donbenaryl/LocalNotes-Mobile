import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Contact2Icon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { PhoneVerificationForm } from "@/components/PhoneVerification/PhoneVerificationForm";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { useContactUsers, type ContactUser } from "@/hooks/useContactUsers";
import accountService from "@/http/account-api/account.services";
import { FindFriendsUsersModal } from "../shared/FindFriendsUsersModal";

interface FindContactsModalProps {
  visible: boolean;
  onClose: () => void;
}

function VerifyPhonePrompt() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="gap-3 rounded-2xl bg-soft px-4 py-4 dark:bg-gray-800/60">
      <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100">
        {t("home.following.findFriends.findContactsModal.verifyPromptTitle")}
      </Text>
      <Text className="font-geist text-[13px] text-gray-500 dark:text-gray-400">
        {t("home.following.findFriends.findContactsModal.verifyPromptBody")}
      </Text>
      {expanded ? (
        <PhoneVerificationForm compact />
      ) : (
        <LocalNotesButton
          label={t("home.following.findFriends.findContactsModal.verifyPromptCta")}
          onPress={() => setExpanded(true)}
          variant="light"
          size="sm"
        />
      )}
    </View>
  );
}

export function FindContactsModal({ visible, onClose }: FindContactsModalProps) {
  const { t } = useTranslation();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await accountService.fetchUser();
      return response.data?.data ?? null;
    },
  });
  const ownPhone = profile?.phone_verified ? profile.phone_number : null;
  const { users, isLoading, error, permission, canAskAgain, requestPermission } =
    useContactUsers(ownPhone);

  const isDenied = permission === "denied";
  const statusMessage = isDenied
    ? t("home.following.findFriends.findContactsModal.permissionDenied")
    : error
      ? t("home.following.findFriends.findContactsModal.loadError")
      : t("home.following.findFriends.findContactsModal.empty");

  const statusAction = isDenied ? (
    <LocalNotesButton
      label={
        canAskAgain
          ? t("home.following.findFriends.findContactsModal.allowAccess")
          : t("home.following.findFriends.findContactsModal.openSettings")
      }
      onPress={() =>
        canAskAgain ? void requestPermission() : void Linking.openSettings()
      }
      variant="light"
      size="sm"
      isWidthFull={false}
    />
  ) : undefined;

  return (
    <FindFriendsUsersModal<ContactUser>
      visible={visible}
      onClose={onClose}
      title={t("home.following.findFriends.findContactsModal.title")}
      users={users}
      isLoading={isLoading}
      statusMessage={statusMessage}
      statusAction={statusAction}
      headerContent={profile && !profile.phone_verified ? <VerifyPhonePrompt /> : null}
      renderSubtitle={(user) =>
        user.contactName
          ? {
              text: t("home.following.findFriends.findContactsModal.inYourContacts", {
                name: user.contactName,
              }),
              icon: <Contact2Icon size={12} color="#9CA3AF" />,
            }
          : undefined
      }
      invalidateKeys={[["contactUsers"]]}
    />
  );
}
