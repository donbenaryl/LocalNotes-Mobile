import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { MatchBadge } from "@/components/ui/MatchBadge";
import {
  getDominantPersonalityColor,
  getPersonalityGradientColors,
} from "@/utils/personalityRing";
import type { profileItemDAO } from "@/http/account-api/types";

interface ProfileStickyInfoBarProps {
  profile: profileItemDAO;
  isOwnProfile?: boolean;
}

export function ProfileStickyInfoBar({
  profile,
  isOwnProfile = true,
}: ProfileStickyInfoBarProps) {
  const gradientColors = getPersonalityGradientColors(profile.personality_color);
  const accentColor = getDominantPersonalityColor(profile.personality_color);
  const showOtherUserActions = !isOwnProfile && Boolean(profile.id);

  return (
    <View className="flex-row items-center gap-2.5 px-4 pb-2">
      <Avatar
        name={profile.name}
        src={profile.profile_image_url}
        size="sm"
        gradientColors={gradientColors}
      />

      <View className="min-w-0 flex-1">
        <Text
          className="font-geist-bold text-[14px] leading-5 text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {profile.name}
        </Text>
        {profile.personality_name ? (
          <Text
            className="mt-0.5 font-fraunces text-[12px] italic leading-4"
            style={{ color: accentColor }}
            numberOfLines={1}
          >
            {profile.personality_name}
          </Text>
        ) : null}
      </View>

      {showOtherUserActions ? (
        <>
          <MatchBadge
            userId={profile.id!}
            personalityColor={profile.personality_color}
          />
          <FollowButton
            userId={profile.id!}
            initialIsFollowed={Boolean(profile.is_followed)}
            useButton
            buttonSize="xs"
            isButtonFull={false}
          />
        </>
      ) : null}
    </View>
  );
}
