import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { BookUser, ChevronRight, Contact2Icon, RadioTower, Share2Icon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { FACEBOOK_BLUE, FacebookIcon } from "@/components/ui/icons/FacebookIcon";
import { getWebAppUrl } from "@/http/environment.config";
import { useAuthStore } from "@/stores/useAuthStore";
import { ConnectNowModal } from "./ConnectNow/ConnectNowModal";
import { FindContactsModal } from "./FindContacts/FindContactsModal";

type FindFriendsOptionId = "connectNow" | "inviteFriends" | "findContacts" | "findFacebook";

interface FindFriendsOption {
  id: FindFriendsOptionId;
  color: string;
  icon: ReactNode;
}

const ICON_SIZE = 24;
const ICON_COLOR = "#FFFFFF";
const BRAND_ORANGE = "#FF6B1A";
/** iOS can't present a second RN Modal until the first has finished dismissing. */
const MODAL_HANDOFF_DELAY_MS = 350;

const OPTIONS: FindFriendsOption[] = [
  {
    id: "connectNow",
    color: "#8B5CF6",
    icon: <RadioTower size={ICON_SIZE} color={ICON_COLOR} />,
  },
  {
    id: "inviteFriends",
    color: "#E8B23F",
    icon: <Share2Icon size={ICON_SIZE} color={ICON_COLOR} fill={ICON_COLOR} />,
  },
  {
    id: "findContacts",
    color: "#4CAF3D",
    icon: <Contact2Icon size={ICON_SIZE} color={ICON_COLOR} />,
  },
  {
    id: "findFacebook",
    color: FACEBOOK_BLUE,
    icon: <FacebookIcon />,
  },
];

export function FollowingFindFriends() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const userId = useAuthStore((state) => state.user?.id);
  const [visible, setVisible] = useState(false);
  const [connectNowVisible, setConnectNowVisible] = useState(false);
  // Mount lazily so location/contacts permission is only requested once the user opts in.
  const [connectNowMounted, setConnectNowMounted] = useState(false);
  const [findContactsVisible, setFindContactsVisible] = useState(false);
  const [findContactsMounted, setFindContactsMounted] = useState(false);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chevronColor = colorScheme === "dark" ? "#9CA3AF" : "#6B7280";

  useEffect(
    () => () => {
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    },
    [],
  );

  const handleSelect = (id: FindFriendsOptionId) => {
    setVisible(false);
    if (id === "connectNow") {
      setConnectNowMounted(true);
      handoffTimerRef.current = setTimeout(
        () => setConnectNowVisible(true),
        MODAL_HANDOFF_DELAY_MS,
      );
      return;
    }
    if (id === "findContacts") {
      setFindContactsMounted(true);
      handoffTimerRef.current = setTimeout(
        () => setFindContactsVisible(true),
        MODAL_HANDOFF_DELAY_MS,
      );
      return;
    }
    if (id === "inviteFriends") {
      const webUrl = getWebAppUrl();
      const url = webUrl && userId ? `${webUrl}/user/${userId}` : webUrl;
      void Share.share({
        message: url
          ? t("home.following.findFriends.inviteMessage", { url })
          : t("home.following.findFriends.inviteMessageNoUrl"),
      }).catch(() => undefined);
      return;
    }
    toast.info(t("alerts.comingSoonMessage"), { title: t("alerts.comingSoon") });
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t("home.following.findFriends.rowLabel")}
        className="mt-4 cursor-pointer flex-row items-center gap-3 rounded-2xl bg-soft px-4 py-4 dark:bg-gray-800/60"
      >
        <BookUser size={22} color={BRAND_ORANGE} />
        <Text className="flex-1 font-geist-semibold text-base text-brand">
          {t("home.following.findFriends.rowLabel")}
        </Text>
        <ChevronRight size={20} color={BRAND_ORANGE} />
      </Pressable>

      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        title={t("home.following.findFriends.modalTitle")}
      >
        <View className="gap-5 pb-2 mt-2">
          {OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              accessibilityRole="button"
              className="cursor-pointer flex-row items-center gap-4"
            >
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: option.color }}
              >
                {option.icon}
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-geist-semibold text-base text-ink dark:text-gray-100">
                  {t(`home.following.findFriends.${option.id}.title`)}
                </Text>
                <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                  {t(`home.following.findFriends.${option.id}.subtitle`)}
                </Text>
              </View>
              <ChevronRight size={20} color={chevronColor} />
            </Pressable>
          ))}
        </View>
      </Modal>

      {connectNowMounted ? (
        <ConnectNowModal
          visible={connectNowVisible}
          onClose={() => setConnectNowVisible(false)}
        />
      ) : null}

      {findContactsMounted ? (
        <FindContactsModal
          visible={findContactsVisible}
          onClose={() => setFindContactsVisible(false)}
        />
      ) : null}
    </>
  );
}
