import { Image, Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { Avatar } from "./Avatar";
import { WhiteBox } from "./WhiteBox";
import {
  getPersonalityGradientColors,
  getPersonalityMatchPillStyle,
  getPersonalityRoleColor,
} from "@/utils/personalityRing";

interface UserCardProps {
  name: string;
  role: string;
  match: number;
  personalityDescription: string;
  avatarUrl?: string | null;
  personalityColor?: Record<string, number> | null;
  coverImageUrl: string;
  isSelected: boolean;
  onPress: () => void;
}

export function UserCard({
  name,
  role,
  match,
  personalityDescription,
  avatarUrl,
  personalityColor,
  coverImageUrl,
  isSelected,
  onPress,
}: UserCardProps) {
  const matchValue = Math.max(0, Math.min(100, Math.round(match)));
  const roleColor = getPersonalityRoleColor(role);
  const matchPill = getPersonalityMatchPillStyle(personalityColor);
  const gradientColors = getPersonalityGradientColors(personalityColor);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="w-full cursor-pointer"
    >
      <WhiteBox isSelected={isSelected} className="relative flex flex-col gap-2">
        <View
          className={`absolute right-2 top-2 z-10 h-5 w-5 items-center justify-center rounded-full border ${
            isSelected
              ? "border-brand bg-brand"
              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
          }`}
        >
          {isSelected ? (
            <Check size={10} color="#FFFFFF" strokeWidth={2.4} />
          ) : null}
        </View>

        <View className="flex-row items-center gap-2 pr-5">
          <Avatar
            name={name}
            src={avatarUrl ?? undefined}
            size="md"
            gradientColors={gradientColors}
          />
          <View className="min-w-0 flex-1">
            <Text
              className="font-geist-bold text-[12.5px] leading-[15px] text-ink dark:text-gray-100"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className="mt-0.5 font-geist-medium text-[10.5px]"
              style={{ color: roleColor }}
            >
              {role}
            </Text>
          </View>
          {matchValue > 0 && (
            <View
                className="shrink-0 rounded-[5px] px-1.5 py-0.5"
                style={{ backgroundColor: matchPill.backgroundColor }}
            >
                <Text
                className="font-geist-bold text-[9.5px] leading-3"
                style={{ color: matchPill.color }}
                >
                {matchValue}%
                </Text>
            </View>
          )}
        </View>

        <Text
          className="italic text-[11px] leading-[15px] text-gray-600 dark:text-gray-300"
          numberOfLines={2}
        >
          {personalityDescription}
        </Text>

        <Image
          source={{ uri: coverImageUrl }}
          className="h-[60px] w-full rounded-lg"
          resizeMode="cover"
        />
      </WhiteBox>
    </Pressable>
  );
}
