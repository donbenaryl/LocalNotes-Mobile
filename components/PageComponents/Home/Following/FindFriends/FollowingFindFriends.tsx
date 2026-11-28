import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { BookUser, ChevronRight, Contact2Icon, RadioTower, Send } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { FACEBOOK_BLUE, FacebookIcon } from "@/components/ui/icons/FacebookIcon";
import { getWebAppUrl } from "@/http/environment.config";
import { useAuthStore } from "@/stores/useAuthStore";
import { BRAND, BRAND_ON_DARK } from "@/constants/colors";
import { ConnectNowModal } from "./ConnectNow/ConnectNowModal";
import { FindContactsModal } from "./FindContacts/FindContactsModal";

type FindFriendsOptionId = "connectNow" | "inviteFriends" | "findContacts";

interface FindFriendsOption {
  id: FindFriendsOptionId;
  color: string;
  icon: ReactNode;
}

const ICON_SIZE = 24;
const ICON_COLOR = "#FFFFFF";
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
    icon: <Send size={ICON_SIZE} color={ICON_COLOR} fill={ICON_COLOR} />,
  },
  {
    id: "findContacts",
    color: "#4CAF3D",
    icon: <Contact2Icon size={ICON_SIZE} color={ICON_COLOR} />,
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
  const chevronColor = colorScheme === "dark" ? "#A79E92" : "#6C727F";
  const rowIconColor = colorScheme === "dark" ? BRAND_ON_DARK : BRAND;

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
      // Sign-up link tagged with the inviter so the backend can record `referred_by`.
      const url = webUrl && userId ? `${webUrl}/sign-up?ref=${encodeURIComponent(userId)}` : webUrl;
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
        className="mt-4 cursor-pointer flex-row items-center gap-3 rounded-2xl bg-soft px-4 py-4 dark:bg-dk-card/60"
      >
        <BookUser size={22} color={rowIconColor} />
        <Text className="flex-1 font-geist-semibold text-base text-brand dark:text-dk-text">
          {t("home.following.findFriends.rowLabel")}
        </Text>
        <ChevronRight size={20} color={rowIconColor} />
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
                <Text className="font-geist-semibold text-base text-ink dark:text-dk-text">
                  {t(`home.following.findFriends.${option.id}.title`)}
                </Text>
                <Text className="font-geist text-sm text-gray-500 dark:text-dk-muted">
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
