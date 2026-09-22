import { Pressable, Text, View } from "react-native";
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

type AvatarSize = "xs" | "sm" | "md" | "md2" | "lg" | "xl";

interface ListAuthorRowProps {
  account: ListAuthorRowAccount;
  /** Prefer list-level personality_name when present. */
  personalityName?: string | null;
  /** Gray body subtitle (e.g. business location). Takes precedence over personality. */
  subtitle?: string | null;
  accentColor?: string;
  isOwnList: boolean;
  initialIsFollowed: boolean;
  isFollowed: boolean;
  onFollowToggle: () => void | Promise<void>;
  followLoading?: boolean;
  menuItems?: CardOptionsMenuItem[];
  isDeleting?: boolean;
  className?: string;
  /**
   * Navigate when tapping the identity block.
   * When set, Avatar does not auto-link via `userId` (avoids nested profile routes).
   */
  onPress?: () => void;
  avatarSize?: AvatarSize;
  /**
   * When true (business rows), never pass `userId` to Avatar.
   * Defaults to false so list authors still open `/profile/:id`.
   */
  disableAvatarNavigation?: boolean;
}

export function ListAuthorRow({
  account,
  personalityName,
  subtitle,
  accentColor,
  isOwnList,
  initialIsFollowed,
  isFollowed,
  onFollowToggle,
  followLoading,
  menuItems,
  isDeleting,
  className = "mb-2 flex-row items-center gap-2.5",
  onPress,
  avatarSize = "sm",
  disableAvatarNavigation = false,
}: ListAuthorRowProps) {
  const displayPersonality = personalityName ?? account.personality_name;
  const showMenu = Boolean(menuItems && menuItems.length > 0);
  const ringColors = accentColor ? [accentColor] : undefined;
  const avatarUserId =
    onPress || disableAvatarNavigation ? undefined : account.id;

  const identityInner = (
    <>
      <Avatar
        name={account.name}
        src={resolveImageUrl(account.profile_image) ?? undefined}
        size={avatarSize}
        userId={avatarUserId}
        gradientColors={ringColors}
      />
      <View className="min-w-0 flex-1">
        <Text
          className="font-geist-semibold text-[14.5px] text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {account.name}
        </Text>
        {subtitle ? (
          <Text
            className="font-geist text-[13px] text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : displayPersonality ? (
          <Text
            className="shrink font-fraunces text-[13px] italic"
            style={accentColor ? { color: accentColor } : undefined}
            numberOfLines={1}
          >
            {displayPersonality}
          </Text>
        ) : null}
      </View>
    </>
  );

  return (
    <View className={className}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={account.name}
          className="min-w-0 flex-1 cursor-pointer flex-row items-center gap-2.5"
        >
          {identityInner}
        </Pressable>
      ) : (
        identityInner
      )}

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

        {showMenu ? (
          <View className="-mr-3">
            <CardOptionsMenu
              items={menuItems!}
              iconOrientation="vertical"
              isDeleting={isDeleting}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
