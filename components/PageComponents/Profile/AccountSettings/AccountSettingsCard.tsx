import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { resolveUserLabels } from "@/utils/userDisplayName";
import type { profileItemDAO } from "@/http/account-api/types";
import { WhiteBox } from "@/components/ui/WhiteBox";

interface AccountSettingsCardProps {
  profile: profileItemDAO;
}

export function AccountSettingsCard({ profile }: AccountSettingsCardProps) {
  const gradientColors = getPersonalityGradientColors(
    profile.personality_color,
  );
  const labels = resolveUserLabels(profile);
  const handle = profile.username ? `@${profile.username}` : profile.email;
  const secondary = profile.personality_name
    ? `${handle} · ${profile.personality_name}`
    : handle;

  return (
    <WhiteBox className="mb-4 flex-row items-center gap-3 mx-6">
      <Avatar
        name={labels.primary}
        src={profile.profile_image_url}
        size="md"
        gradientColors={gradientColors}
      />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          className="font-geist-bold text-[15px] text-ink dark:text-dk-text"
          numberOfLines={1}
        >
          {labels.primary}
        </Text>
        <Text
          className="font-geist text-[12.5px] text-gray-500 dark:text-dk-muted"
          numberOfLines={1}
        >
          {secondary}
        </Text>
      </View>
    </WhiteBox>
  );
}
