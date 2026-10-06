import { memo } from "react";
import { Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { resolveImageUrl } from "@/utils/httpHelpers";

interface ConnectNowUserRowProps {
  user: UnifiedSearchPersonDAO;
}

export const ConnectNowUserRow = memo(function ConnectNowUserRow({
  user,
}: ConnectNowUserRowProps) {
  const { t } = useTranslation();
  const address = [user.location?.city, user.location?.region]
    .filter(Boolean)
    .join(", ");

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
          <MapPin size={12} color="#9CA3AF" />
          <Text
            className="min-w-0 flex-1 font-geist text-[13px] text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {address || t("home.following.findFriends.connectNowModal.locationHidden")}
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
