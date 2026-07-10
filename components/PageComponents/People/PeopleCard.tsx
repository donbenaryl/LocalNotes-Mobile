import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { WhiteBox } from "@/components/ui/WhiteBox";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { resolveImageUrl } from "@/utils/httpHelpers";
import {
  getPersonalityGradientColors,
  getPersonalityMatchPillStyle,
  getPersonalityRoleColor,
} from "@/utils/personalityRing";

interface PeopleCardProps {
  data: UnifiedSearchPersonDAO;
  onPress?: () => void;
}

export function PeopleCard({ data, onPress }: PeopleCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const role = data.personality_name ?? "";
  const matchValue = Math.max(0, Math.min(100, Math.round(data.match ?? 0)));
  const roleColor = getPersonalityRoleColor(role);
  const matchPill = getPersonalityMatchPillStyle(data.personality_color);
  const gradientColors = getPersonalityGradientColors(data.personality_color);
  const blurb =
    data.personality_description?.trim() || data.bio?.trim() || "";
  const avatarSrc = data.profile_image_url
    ? resolveImageUrl(data.profile_image_url) ?? data.profile_image_url
    : undefined;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/profile/${data.id}` as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      className="cursor-pointer"
    >
      <WhiteBox className="gap-2 p-3">
        <View className="flex-row items-start gap-3">
          <Avatar
            name={data.name}
            src={avatarSrc}
            userId={data.id}
            size="md"
            gradientColors={gradientColors}
          />

          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2 pr-1">
              <View className="min-w-0 flex-1">
                <Text
                  className="font-geist-bold text-[13.5px] text-ink dark:text-gray-100"
                  numberOfLines={1}
                >
                  {data.name}
                </Text>
                {role ? (
                  <Text
                    className="mt-0.5 font-geist-medium text-[11px]"
                    style={{ color: roleColor }}
                    numberOfLines={1}
                  >
                    {role}
                  </Text>
                ) : null}
              </View>

              {matchValue > 0 ? (
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
              ) : null}
            </View>

            {blurb ? (
              <Text
                className="mt-1.5 font-fraunces text-[12px] italic leading-[16px] text-gray-600 dark:text-gray-300"
                numberOfLines={2}
              >
                {blurb}
              </Text>
            ) : null}

            <View className="mt-2 flex-row items-center justify-between gap-2">
              <Text
                className="min-w-0 flex-1 font-geist text-[11px] text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {t("search.people.stats", {
                  lists: t("search.people.listsCount", {
                    count: data.list_count ?? 0,
                  }),
                  followers: t("search.people.followersCount", {
                    count: data.followers_count ?? 0,
                  }),
                })}
              </Text>
              <FollowButton
                userId={data.id}
                initialIsFollowed={data.is_followed ?? false}
              />
            </View>
          </View>
        </View>
      </WhiteBox>
    </Pressable>
  );
}
