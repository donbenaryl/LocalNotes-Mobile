import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { MoreVertical, Pencil, Share2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { ICON_COLOR_DARK, ICON_COLOR_LIGHT } from "@/constants/colors";
import { ProfileHeader } from "./ProfileHeader";

interface ProfileTopActionsProps {
  isOwnProfile: boolean;
  isBusinessPage: boolean;
  onEditPress: () => void;
  onSharePress: () => void;
  onMorePress?: () => void;
}

function HeaderIconButton({
  onPress,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:opacity-70 dark:bg-gray-800"
    >
      {children}
    </Pressable>
  );
}

export function ProfileTopActions({
  isOwnProfile,
  isBusinessPage,
  onEditPress,
  onSharePress,
  onMorePress,
}: ProfileTopActionsProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? ICON_COLOR_DARK : ICON_COLOR_LIGHT;

  const editLabel = isBusinessPage
    ? t("profile.info.editBusiness")
    : t("profile.info.editProfile");
  const shareLabel = isBusinessPage
    ? t("profile.info.shareBusiness")
    : t("profile.info.shareProfile");

  const showOwnMenu = isOwnProfile;
  const showOtherMenu = !isOwnProfile && Boolean(onMorePress);

  return (
    <View className="flex-row items-center gap-2">
      {isOwnProfile ? (
        <HeaderIconButton onPress={onEditPress} accessibilityLabel={editLabel}>
          <Pencil size={16} color={iconColor} strokeWidth={2.2} />
        </HeaderIconButton>
      ) : null}

      <HeaderIconButton onPress={onSharePress} accessibilityLabel={shareLabel}>
        <Share2 size={16} color={iconColor} strokeWidth={2.2} />
      </HeaderIconButton>

      {showOwnMenu ? (
        <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <ProfileHeader />
        </View>
      ) : null}

      {showOtherMenu ? (
        <HeaderIconButton
          onPress={onMorePress!}
          accessibilityLabel={t("common.more")}
        >
          <MoreVertical size={18} color={iconColor} strokeWidth={2} />
        </HeaderIconButton>
      ) : null}
    </View>
  );
}
