import { Text, View } from "react-native";
import { FollowButton } from "@/components/ui/FollowButton";
import { Avatar } from "@/components/ui/Avatar";
import { WhiteBox } from "@/components/ui/WhiteBox";
import {
  resolveUserLabels,
  type UserNameFields,
} from "@/utils/userDisplayName";

interface ProfileSimilarUserCardProps {
  id: string;
  user: UserNameFields;
  followers: number;
  interactions: string;
  listCount: number;
  isFollowed: boolean;
}

export function ProfileSimilarUserCard({
  id,
  user,
  followers,
  interactions,
  listCount,
  isFollowed,
}: ProfileSimilarUserCardProps) {
  const displayName = resolveUserLabels(user).primary;

  return (
    <WhiteBox>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <Avatar
            name={displayName}
            size="sm"
            userId={id}
            viewOrigin="recommendation"
          />
          <View className="flex-1 min-w-0">
            <Text className="font-geist-medium text-sm text-ink dark:text-dk-text">
              {displayName}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-dk-muted">
              {followers.toLocaleString()} follower{followers !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <FollowButton userId={id} initialIsFollowed={isFollowed} />
      </View>
      <View className="flex-row items-center justify-between mt-3 px-2">
        <Text className="text-xs text-gray-500 dark:text-dk-muted font-geist-medium">
          {interactions}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-dk-muted">
          {listCount} List{listCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </WhiteBox>
  );
}
