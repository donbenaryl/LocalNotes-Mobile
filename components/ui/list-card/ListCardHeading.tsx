import { Pressable, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { CardOptionsMenu } from "@/components/ui/CardOptionsMenu";
import { FollowButton } from "@/components/ui/FollowButton";
import { PersonalityName } from "@/components/ui/PersonalityName";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { getDominantPersonalityTextColor } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import type { Account } from "@/http/list-api/types";
import type { similarUserScore } from "@/http/recommendations-api/types";

interface ListCardHeadingProps {
  account: Account;
  isDraft: boolean;
  onProfileClick: () => void;
  personalityName?: string;
  isUser: boolean;
  similarScores?: similarUserScore;
  disableActions: boolean;
  isDeleting: boolean;
  currentUserId?: string;
  isFollowed: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  forceShowFollowButton?: boolean;
}

export function ListCardHeading({
  account,
  onProfileClick,
  personalityName,
  isUser,
  similarScores,
  disableActions,
  isDeleting,
  currentUserId,
  isFollowed,
  onEdit,
  onDelete,
  onPin,
  isDraft,
  forceShowFollowButton = false,
}: ListCardHeadingProps) {
  const gradientColors = getPersonalityGradientColors(account.personality_color);
  const personalityColor = getDominantPersonalityTextColor(account.personality_color);

  return (
    <View className="mb-1 flex-row items-start justify-between">
      <Pressable
        onPress={onProfileClick}
        disabled={disableActions}
        accessibilityRole="button"
        className="flex-1 cursor-pointer flex-row items-center gap-3"
      >
        <Avatar
          name={account.name}
          src={resolveImageUrl(account.profile_image) ?? undefined}
          size="sm"
          userId={account.id}
          gradientColors={gradientColors}
        />
        <View className="min-w-0 flex-1">
          <Text
            className="font-geist text-xs text-ink dark:text-gray-100"
            numberOfLines={1}
          >
            {account.name}
          </Text>
          {(personalityName || (!isUser && similarScores)) && (
            <View className="mt-0.5 flex-row items-center gap-3">
              {personalityName ? (
                <PersonalityName
                  name={personalityName}
                  personalityColor={account.personality_color}
                  variant="text"
                />
              ) : null}
              {!isUser && similarScores ? (
                <Text
                  className="font-geist text-xs text-gray-400"
                  style={{ color: personalityColor }}
                  numberOfLines={1}
                >
                  {similarScores.reason.overall_score.toFixed(0)}% Match
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </Pressable>

      {isUser && !disableActions ? (
        <CardOptionsMenu
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={!isDraft ? onPin : undefined}
          isDeleting={isDeleting}
        />
      ) : currentUserId !== account.id && !disableActions ? (
        <FollowButton userId={account.id} initialIsFollowed={isFollowed} />
      ) : forceShowFollowButton ? (
        <Text className="font-geist text-xs text-gray-500 opacity-80">+ Follow</Text>
      ) : null}
    </View>
  );
}
