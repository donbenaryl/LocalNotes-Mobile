import { Text, View } from "react-native";
import { FollowButton } from "@/components/ui/FollowButton";
import { Avatar } from "@/components/ui/Avatar";
import { WhiteBox } from "@/components/ui/WhiteBox";

interface ProfileSimilarUserCardProps {
  id: string;
  name: string;
  followers: number;
  interactions: string;
  listCount: number;
  isFollowed: boolean;
}

export function ProfileSimilarUserCard({
  id,
  name,
  followers,
  interactions,
  listCount,
  isFollowed,
}: ProfileSimilarUserCardProps) {
  return (
    <WhiteBox>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <Avatar name={name} size="sm" userId={id} />
          <View className="flex-1 min-w-0">
            <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">{name}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {followers.toLocaleString()} follower{followers !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <FollowButton userId={id} initialIsFollowed={isFollowed} />
      </View>
      <View className="flex-row items-center justify-between mt-3 px-2">
        <Text className="text-xs text-gray-500 dark:text-gray-400 font-geist-medium">
          {interactions}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {listCount} List{listCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </WhiteBox>
  );
}
