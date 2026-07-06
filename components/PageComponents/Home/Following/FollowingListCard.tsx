import { Image, Pressable, Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { NoImage } from "@/components/ui/NoImage";
import { PersonalityName } from "@/components/ui/PersonalityName";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { useRouter } from "expo-router";
import type { ActivityItemDAO, ActivityListData } from "@/http/home-api/type";
import { formatListLocation } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import {
  getPersonalityGradientColors,
  getPersonalityMatchPillStyle,
} from "@/utils/personalityRing";
import { formatRelativeTime } from "@/utils/time";

interface FollowingListCardProps {
  item: ActivityItemDAO & { entity: "list" };
}

const ACTION_I18N_KEY: Record<ActivityItemDAO["action"], string> = {
  create: "home.following.activity.create",
  update: "home.following.activity.update",
  like: "home.following.activity.like",
  save: "home.following.activity.save",
  share: "home.following.activity.share",
  comment: "home.following.activity.comment",
  follow: "home.following.activity.follow",
};

function getHeroImageUrl(list: ActivityListData): string | null {
  const cover = resolveImageUrl(list.image_url);
  if (cover) return cover;

  for (const pick of list.items ?? []) {
    const itemImage =
      resolveImageUrl(pick.images?.[0]?.url) ??
      resolveImageUrl(pick.business?.logo);
    if (itemImage) return itemImage;
  }

  return null;
}

function isActivityListData(
  data: ActivityItemDAO["data"],
): data is ActivityListData {
  return "items" in data;
}

export function FollowingListCard({ item }: FollowingListCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (!isActivityListData(item.data)) {
    return null;
  }

  const list = item.data;
  const gradientColors = getPersonalityGradientColors(
    item.account.personality_color,
  );
  const personalityName = item.account.personality_name ?? undefined;
  const heroImageUrl = getHeroImageUrl(list);
  const locationLabel =
    formatListLocation(list.location) || t("home.unknownLocation");
  const picksCount = list.items?.length ?? 0;
  const similarityPillStyle = getPersonalityMatchPillStyle(
    item.account.personality_color,
  );

  const handleListPress = () => {
    router.push(`/lists/${list.id}` as never);
  };

  return (
    <WhiteBox className="gap-3 p-4">
      <View className="flex-row items-start gap-3">
        <Avatar
          name={item.account.name}
          src={resolveImageUrl(item.account.profile_image) ?? undefined}
          size="sm"
          userId={item.account.id}
          gradientColors={gradientColors}
        />

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
              <Text
                className="font-geist-semibold text-sm text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {item.account.name}
              </Text>
              {personalityName ? (
                <PersonalityName
                  name={personalityName}
                  personalityColor={item.account.personality_color}
                  variant="text"
                />
              ) : null}
            </View>
            <Text className="shrink-0 font-geist text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>

          <Text className="font-geist text-sm text-gray-600 dark:text-gray-400">
            {t(ACTION_I18N_KEY[item.action])}{" "}
            <Text className="font-geist-semibold text-ink dark:text-gray-100">
              {t("home.following.activity.listObject")}
            </Text>
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleListPress}
        accessibilityRole="button"
        className="cursor-pointer"
      >
        <View className="flex-row items-center gap-3 rounded-2xl bg-soft p-3 dark:bg-gray-800/60">
          {heroImageUrl ? (
            <View className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
              <Image
                source={{ uri: heroImageUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>
          ) : (
            <NoImage
              personalityColor={list.personality_color ?? item.account.personality_color}
              size="sm"
            />
          )}

          <View className="min-w-0 flex-1 gap-1">
            <Text
              className="font-geist-semibold text-sm text-ink dark:text-gray-100"
              numberOfLines={2}
            >
              {list.name}
            </Text>
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color="#9CA3AF" />
              <Text
                className="font-geist text-xs text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {locationLabel} · {t("home.picksCount", { count: picksCount })}
              </Text>
            </View>
          </View>

          {list.similarity != null ? (
            <View
              className="shrink-0 rounded-full px-2.5 py-1"
              style={{ backgroundColor: similarityPillStyle.backgroundColor }}
            >
              <Text
                className="font-geist-semibold text-xs"
                style={{ color: similarityPillStyle.color }}
              >
                {list.similarity}%
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </WhiteBox>
  );
}
