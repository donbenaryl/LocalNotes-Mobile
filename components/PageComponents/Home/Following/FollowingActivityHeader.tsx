import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import type { Account } from "@/http/list-api/types";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getPersonalityGradientColors } from "@/utils/personalityRing";

interface FollowingActivityHeaderProps {
  account: Account;
  actionText: ReactNode;
  locationLabel?: string | null;
  right?: ReactNode;
}

export function FollowingActivityHeader({
  account,
  actionText,
  locationLabel,
  right,
}: FollowingActivityHeaderProps) {
  return (
    <View className="flex-row items-start gap-3">
      <Avatar
        name={account.name}
        src={resolveImageUrl(account.profile_image) ?? undefined}
        size="xs"
        userId={account.id}
        gradientColors={getPersonalityGradientColors(account.personality_color)}
      />

      <View className="min-w-0 flex-1 justify-center gap-0.5 pt-0.5">
        <Text className="text-ink dark:text-gray-100" numberOfLines={2}>
          <Text className="font-geist-semibold">{account.name}</Text>
          <Text className="font-geist text-sm dark:text-orange-200 text-orange-300">
            {"  "}
            {actionText}
          </Text>
        </Text>
        {locationLabel ? (
          <Text
            className="font-geist text-xs text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {locationLabel}
          </Text>
        ) : null}
      </View>

      {right ? <View className="shrink-0">{right}</View> : null}
    </View>
  );
}
