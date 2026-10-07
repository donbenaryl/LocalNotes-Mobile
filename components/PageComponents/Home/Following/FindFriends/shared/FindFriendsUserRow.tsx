import { memo, type ReactNode } from "react";
import { Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { resolveImageUrl } from "@/utils/httpHelpers";

interface FindFriendsUserRowProps {
  user: UnifiedSearchPersonDAO;
  /** Overrides the default location line. */
  subtitle?: string;
  /** Icon shown before `subtitle`; defaults to a map pin when no subtitle override is given. */
  subtitleIcon?: ReactNode;
}

export const FindFriendsUserRow = memo(function FindFriendsUserRow({
  user,
  subtitle,
  subtitleIcon,
}: FindFriendsUserRowProps) {
  const { t } = useTranslation();
  const address = [user.location?.city, user.location?.region]
    .filter(Boolean)
    .join(", ");
  const line =
    subtitle ?? (address || t("home.following.findFriends.usersModal.locationHidden"));
  const icon =
    subtitle === undefined ? <MapPin size={12} color="#9CA3AF" /> : subtitleIcon ?? null;

  return (
    <View className="flex-row items-center gap-3 py-3">
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
        <View className="mt-0.5 flex-row items-center gap-1">
          {icon}
          <Text
            className="min-w-0 flex-1 font-geist text-[13px] text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {line}
          </Text>
        </View>
      </View>
      <View>
        <FollowButton
          userId={user.id}
          initialIsFollowed={Boolean(user.is_followed)}
          useButton
          buttonSize="xs"
          isButtonFull={false}
          variant="outline"
        />
      </View>
    </View>
  );
});
