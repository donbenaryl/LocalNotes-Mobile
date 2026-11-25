import { Image, Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { Avatar } from "./Avatar";
import { WhiteBox } from "./WhiteBox";
import {
  getPersonalityGradientColors,
  getPersonalityRoleColor,
} from "@/utils/personalityRing";
import { clampPercent, getMatchPercentColor } from "@/utils/matchScore";
import {
  resolveUserLabels,
  type UserNameFields,
} from "@/utils/userDisplayName";

interface UserCardProps {
  user: UserNameFields;
  role: string;
  match?: number | null;
  personalityDescription: string;
  avatarUrl?: string | null;
  personalityColor?: Record<string, number> | null;
  coverImageUrl: string;
  isSelected: boolean;
  onPress: () => void;
}

export function UserCard({
  user,
  role,
  match,
  personalityDescription,
  avatarUrl,
  personalityColor,
  coverImageUrl,
  isSelected,
  onPress,
}: UserCardProps) {
  const { primary } = resolveUserLabels(user);
  const matchValue = match == null ? null : clampPercent(match);
  const roleColor = getPersonalityRoleColor(role);
  const matchColor = getMatchPercentColor(matchValue ?? 0);
  const gradientColors = getPersonalityGradientColors(personalityColor);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="w-full cursor-pointer"
    >
      <WhiteBox
        isSelected={isSelected}
        className="relative flex flex-col gap-2"
      >
        <View className="flex-row items-start gap-2">
          <Avatar
            name={primary}
            src={avatarUrl ?? undefined}
            size="md"
            gradientColors={gradientColors}
          />
          <View className="min-w-0 flex-1">
            <Text
              className="font-geist-bold text-[12.5px] leading-[15px] text-ink dark:text-dk-text"
              numberOfLines={1}
            >
              {primary}
            </Text>
            <Text
              className="mt-0.5 font-geist-medium text-[10.5px]"
              style={{ color: roleColor }}
              numberOfLines={2}
            >
              {role}
            </Text>
          </View>
        </View>

        <Text
          className="italic text-[11px] leading-[15px] text-gray-600 dark:text-dk-body"
          numberOfLines={2}
        >
          {personalityDescription}
        </Text>
        <Image
          source={{ uri: coverImageUrl }}
          className="h-[60px] w-full rounded-lg"
          resizeMode="cover"
        />

        {matchValue != null ? (
          <View
            className="mt-1 self-end rounded-[5px] px-1.5 py-0.5"
            style={{ backgroundColor: `${matchColor}24` }}
          >
            <Text
              className="font-geist-bold text-[9.5px] leading-3"
              style={{ color: matchColor }}
            >
              {matchValue}%
            </Text>
          </View>
        ) : null}
      </WhiteBox>
    </Pressable>
  );
}
