import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import {
  CardOptionsMenu,
  type CardOptionsMenuItem,
} from "@/components/ui/CardOptionsMenu";
import { FollowButton } from "@/components/ui/FollowButton";
import { resolveImageUrl } from "@/utils/httpHelpers";

export interface ListAuthorRowAccount {
  id: string;
  name: string;
  profile_image?: string | null;
  personality_name?: string | null;
}

interface ListAuthorRowProps {
  account: ListAuthorRowAccount;
  /** Prefer list-level personality_name when present. */
  personalityName?: string | null;
  accentColor: string;
  isOwnList: boolean;
  initialIsFollowed: boolean;
  isFollowed: boolean;
  onFollowToggle: () => void | Promise<void>;
  followLoading?: boolean;
  menuItems: CardOptionsMenuItem[];
  isDeleting?: boolean;
  className?: string;
}

export function ListAuthorRow({
  account,
  personalityName,
  accentColor,
  isOwnList,
  initialIsFollowed,
  isFollowed,
  onFollowToggle,
  followLoading,
  menuItems,
  isDeleting,
  className = "mb-2 flex-row items-center gap-2.5",
}: ListAuthorRowProps) {
  const displayPersonality = personalityName ?? account.personality_name;

  return (
    <View className={className}>
      <Avatar
        name={account.name}
        src={resolveImageUrl(account.profile_image) ?? undefined}
        size="sm"
        userId={account.id}
        gradientColors={[accentColor]}
      />
      <View className="min-w-0 flex-1">
        <Text
          className="font-geist-semibold text-[14.5px] text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {account.name}
        </Text>
        {displayPersonality ? (
          <Text
            className="shrink font-fraunces text-[13px] italic"
            style={{ color: accentColor }}
            numberOfLines={1}
          >
            {displayPersonality}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center">
        {!isOwnList ? (
          <FollowButton
            userId={account.id}
            initialIsFollowed={initialIsFollowed}
            isFollowed={isFollowed}
            onToggle={onFollowToggle}
            loading={followLoading}
            variant="outline"
          />
        ) : null}

        <View className="-mr-3">
          <CardOptionsMenu
            items={menuItems}
            iconOrientation="vertical"
            isDeleting={isDeleting}
          />
        </View>
      </View>
    </View>
  );
}
