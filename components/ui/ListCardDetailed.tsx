import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, Heart, TrendingUp } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import listService from "@/http/list-api/list.service";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { NoImage } from "@/components/ui/NoImage";
import { PersonalityName } from "@/components/ui/PersonalityName";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatListLocation } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import {
  formatRelativeTime,
  formatRelativeTimeUpper,
  isCreatedWithinHours,
} from "@/utils/time";
import type { Item, ListItemDAO } from "@/http/list-api/types";
import { WhiteBox } from "./WhiteBox";

interface ListCardDetailedProps {
  list: ListItemDAO;
  variant?: "default" | "forYou";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function getHeroImageUrl(list: ListItemDAO): string | null {
  const cover = resolveImageUrl(list.image_url);
  if (cover) return cover;

  for (const item of list.items ?? []) {
    const itemImage =
      resolveImageUrl(item.images?.[0]?.url) ??
      resolveImageUrl(item.business?.logo);
    if (itemImage) return itemImage;
  }

  return null;
}

function getPickName(item: Item): string | null {
  return item.business?.name ?? item.unverified_business?.name ?? null;
}

function toLinearGradientColors(
  colors: string[],
): [string, string, ...string[]] {
  if (colors.length === 1) {
    return [colors[0], colors[0]];
  }
  return colors.slice(0, 4) as [string, string, ...string[]];
}

function PickPreviewRow({
  item,
  personalityColor,
  compactTags = false,
}: {
  item: Item;
  personalityColor?: Record<string, number> | null;
  compactTags?: boolean;
}) {
  const { t } = useTranslation();
  const name = getPickName(item);
  if (!name) return null;

  const imageUrl =
    resolveImageUrl(item.images?.[0]?.url) ??
    resolveImageUrl(item.business?.logo);
  const maxVisibleTags = compactTags ? 2 : 3;
  const visibleTags = item.tags.slice(0, maxVisibleTags);
  const extraTagCount = item.tags.length - visibleTags.length;

  return (
    <View className="flex-row gap-3 py-3">
      {imageUrl ? (
        <View className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
        </View>
      ) : (
        <NoImage
          personalityColor={personalityColor}
          size="sm"
          appearance="flat"
          innerClassName="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        />
      )}

      <View className="min-w-0 flex-1 justify-center gap-0.5">
        <Text
          className="font-geist-medium text-sm text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {name}
        </Text>

        {item.description ? (
          <Text
            className="font-geist text-xs text-gray-500 dark:text-gray-400"
            numberOfLines={compactTags ? 1 : 2}
          >
            {item.description}
          </Text>
        ) : null}

        {visibleTags.length > 0 ? (
          <View className="mt-0.5 flex-row flex-wrap items-center">
            <Text
              className="font-geist text-[10.5px] text-gray-400"
              numberOfLines={1}
            >
              {visibleTags.map((tag) => tag.name).join(" · ")}
            </Text>
            {extraTagCount > 0 ? (
              <View className="ml-2 rounded-full bg-soft px-1.5 py-0.5 dark:bg-gray-700">
                <Text className="font-geist-semibold text-[10.5px] text-gray-500 dark:text-gray-400">
                  {t("home.forYou.moreTags", { count: extraTagCount })}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ListCardDetailed({
  list,
  variant = "default",
}: ListCardDetailedProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();

  const isForYou = variant === "forYou";
  const isOwnList = user?.id === list.account.id;
  const picksCount = list.items?.length ?? 0;
  const locationLabel = formatListLocation(list.location);
  const cityLabel = list.location?.city ?? locationLabel;
  const heroImageUrl = getHeroImageUrl(list);
  const previewLimit = isForYou ? 1 : 2;
  const previewItems = (list.items ?? []).slice(0, previewLimit);
  const extraPickCount = picksCount - previewItems.length;
  const showNewBadge = isCreatedWithinHours(list.created_at, 24);
  const updatedAt = list.updated_at ?? list.created_at;
  const gradientColors = getPersonalityGradientColors(
    list.account.personality_color,
  );

  const [isSaved, setIsSaved] = useState(list.is_saved);
  const [isLiked, setIsLiked] = useState(list.is_liked);
  const [saves, setSaves] = useState(list.saves ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setIsSaved(list.is_saved);
    setIsLiked(list.is_liked);
    setSaves(list.saves ?? 0);
  }, [list.id, list.is_saved, list.is_liked, list.saves]);

  const handleCardPress = () => {
    router.push(`/lists/${list.id}` as never);
  };

  const handleSave = async () => {
    if (isSaving || isOwnList) return;
    setIsSaving(true);
    const previousSaved = isSaved;
    const previousSaves = saves;
    const nextSaved = !previousSaved;
    const nextSaves = nextSaved
      ? previousSaves + 1
      : Math.max(0, previousSaves - 1);

    setIsSaved(nextSaved);
    setSaves(nextSaves);

    try {
      await listService.saveUnsaveList(list.id);
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setIsSaved(previousSaved);
      setSaves(previousSaves);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLike = async () => {
    if (isLiking || isOwnList) return;
    setIsLiking(true);
    const previousLiked = isLiked;
    const nextLiked = !previousLiked;

    setIsLiked(nextLiked);

    try {
      await listService.likeUnlikeList(list.id);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(previousLiked);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Pressable onPress={handleCardPress} accessibilityRole="button">
      <WhiteBox className="p-0">
        {/* Hero image */}
        {heroImageUrl && (
          <View className="relative h-44 w-full overflow-hidden">
            <Image
              source={{ uri: heroImageUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />

            {showNewBadge ? (
              <View className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1">
                <Text className="font-geist-semibold text-[10px] tracking-wide text-white">
                  {t("home.newBadge", {
                    time: formatRelativeTimeUpper(list.created_at),
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <View className="px-4 pt-3">
          {/* Author row */}
          <View className="mb-3 flex-row items-center justify-between">
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <Avatar
                name={list.account.name}
                src={resolveImageUrl(list.account.profile_image) ?? undefined}
                size="sm"
                userId={list.account.id}
                gradientColors={gradientColors}
              />
              <View className="min-w-0 flex-1">
                <View className="flex-row flex-wrap items-center gap-1">
                  <Text
                    className="font-geist-semibold text-sm text-ink dark:text-gray-100"
                    numberOfLines={1}
                  >
                    {list.account.name}
                  </Text>
                  {list.personality_name ? (
                    <PersonalityName
                      name={list.personality_name}
                      personalityColor={list.personality_color}
                      variant="text"
                    />
                  ) : null}
                </View>

                <Text
                  className="font-geist text-xs text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                >
                  {t("home.authorMeta", {
                    location: cityLabel || t("home.unknownLocation"),
                    count: picksCount,
                  })}
                </Text>
              </View>
            </View>

            {!isOwnList ? (
              <View className="ml-2 flex-row items-center gap-1.5">
                <LocalNotesButton
                  onPress={() => void handleLike()}
                  disabled={isLiking}
                  loading={isLiking}
                  size="xs"
                  variant={isLiked ? "brand" : "light"}
                  isRounded
                  isWidthFull={false}
                  className="px-2.5"
                  label=""
                  leftIcon={
                    <Heart
                      size={15}
                      color={isLiked ? "#FFFFFF" : "#9CA3AF"}
                      fill={isLiked ? "#FFFFFF" : "transparent"}
                    />
                  }
                />

                <LocalNotesButton
                  onPress={() => void handleSave()}
                  disabled={isSaving}
                  loading={isSaving}
                  size="xs"
                  variant={isSaved ? "brand" : "light"}
                  isRounded
                  isWidthFull={false}
                  className="px-2.5"
                  label=""
                  leftIcon={
                    <Bookmark
                      size={15}
                      color={isSaved ? "#FFFFFF" : "#9CA3AF"}
                      fill={isSaved ? "#FFFFFF" : "transparent"}
                      stroke={isSaved ? "#FFFFFF" : "#9CA3AF"}
                    />
                  }
                />

                <FollowButton
                  userId={list.account.id}
                  initialIsFollowed={list.account_is_followed}
                  buttonSize="xs"
                  isButtonFull={false}
                  useButton
                />
              </View>
            ) : null}
          </View>

          {/* Title + description */}
          <Text
            className="mb-1 font-geist-bold text-lg text-ink dark:text-gray-100"
            numberOfLines={2}
          >
            {list.name}
          </Text>

          {list.notes ? (
            <Text
              className="mb-3 font-geist text-sm italic leading-5 text-gray-500 
            dark:text-gray-400"
              numberOfLines={3}
            >
              {stripHtml(list.notes)}
            </Text>
          ) : null}

          {/* Pick previews */}
          {previewItems.length > 0 ? (
            <View className="border-t border-gray-200 dark:border-gray-700">
              {previewItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? (
                    <View className="border-t border-gray-100 dark:border-gray-800" />
                  ) : null}
                  <PickPreviewRow
                    item={item}
                    personalityColor={list.account.personality_color}
                    compactTags={isForYou}
                  />
                </View>
              ))}
              {extraPickCount > 0 ? (
                <Text className="pb-3 font-geist text-xs text-gray-400">
                  {t("profile.lists.morePicks", { count: extraPickCount })}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Footer stats */}
        <View className="flex-row bg-page overflow-hidden py-2 border-t border-gray-100 dark:border-gray-800 dark:bg-gray-800">
          <View className="flex-1 items-center justify-center px-2 py-3">
            <Text
              className="text-center font-geist text-xs text-gray-600 dark:text-gray-400"
              numberOfLines={1}
            >
              {cityLabel || "—"}
            </Text>
          </View>

          <View className="flex-1 items-center justify-center px-2 py-3">
            <Text
              className="text-center font-geist text-xs italic text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {t("home.updated", { time: formatRelativeTime(updatedAt) })}
            </Text>
          </View>

          <View className="flex-1 flex-row items-center justify-center gap-1 px-2 py-3">
            <TrendingUp size={12} color="#15803D" />
            <Text
              className="text-center font-geist text-xs text-success"
              numberOfLines={1}
            >
              {t("home.savesCount", { count: saves })}
            </Text>
          </View>
        </View>
      </WhiteBox>
    </Pressable>
  );
}
