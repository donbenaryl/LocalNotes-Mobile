import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  Bookmark,
  Edit,
  Heart,
  Pin,
  Trash2,
  TrendingUp,
  UserPlus,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import listService from "@/http/list-api/list.service";
import accountService from "@/http/account-api/account.services";
import { Avatar } from "@/components/ui/Avatar";
import { CardHero } from "@/components/ui/CardHero";
import {
  CardOptionsMenu,
  type CardOptionsMenuItem,
} from "@/components/ui/CardOptionsMenu";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { NoImage } from "@/components/ui/NoImage";
import { PersonalityName } from "@/components/ui/PersonalityName";
import { useAuthStore } from "@/stores/useAuthStore";
import { useListFormStore } from "@/stores/useListFormStore";
import { formatListLocation } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { isOthersCategoryName } from "@/utils/listCategories";
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
  onDeleted?: (id: string) => void;
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

function formatListCategoriesSubtitle(
  categories: string[],
  othersName?: string | null,
): string | undefined {
  if (categories.length === 0) return undefined;
  return categories
    .map((category) =>
      isOthersCategoryName(category) ? (othersName ?? category) : category,
    )
    .join(" · ");
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
  onDeleted,
}: ListCardDetailedProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
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
  const [isPinned, setIsPinned] = useState(list.is_pinned);
  const [isFollowed, setIsFollowed] = useState(list.account_is_followed);
  const [saves, setSaves] = useState(list.saves ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setIsSaved(list.is_saved);
    setIsLiked(list.is_liked);
    setSaves(list.saves ?? 0);
  }, [list.id, list.is_saved, list.is_liked, list.saves]);

  useEffect(() => {
    setIsPinned(list.is_pinned);
  }, [list.id, list.is_pinned]);

  useEffect(() => {
    setIsFollowed(list.account_is_followed);
  }, [list.id, list.account_is_followed]);

  const handleCardPress = () => {
    router.push(`/lists/${list.id}` as never);
  };

  const handleEdit = useCallback(() => {
    useListFormStore.getState().clearEditHydration();
    router.push(`/(app)/(stack)/lists/${list.id}/edit` as never);
  }, [list.id, router]);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await listService.deleteList(list.id);
      setIsDeleteModalOpen(false);
      onDeleted?.(list.id);
    } catch (error) {
      console.error("Failed to delete the list:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [list.id, onDeleted]);

  const handlePin = useCallback(async () => {
    if (isPinning) return;
    setIsPinning(true);
    const previousPinned = isPinned;
    const nextPinned = !previousPinned;

    setIsPinned(nextPinned);

    try {
      if (previousPinned) {
        await listService.unpinLists(list.id);
      } else {
        await listService.pinLists(list.id);
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      setIsPinned(previousPinned);
    } finally {
      setIsPinning(false);
    }
  }, [isPinning, isPinned, list.id]);

  const handleSave = useCallback(async () => {
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
  }, [isSaving, isOwnList, isSaved, saves, list.id]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
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
  }, [isLiking, isLiked, list.id]);

  const handleFollowToggle = useCallback(async () => {
    if (isFollowLoading || isOwnList) return;
    setIsFollowLoading(true);
    const previousFollowed = isFollowed;
    const nextFollowed = !previousFollowed;

    setIsFollowed(nextFollowed);

    try {
      if (previousFollowed) {
        await accountService.unfollowUser(list.account.id);
      } else {
        await accountService.followUser(list.account.id);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      setIsFollowed(previousFollowed);
    } finally {
      setIsFollowLoading(false);
    }
  }, [isFollowLoading, isOwnList, isFollowed, list.account.id]);

  const menuItems = useMemo((): CardOptionsMenuItem[] => {
    if (isOwnList) {
      return [
        {
          kind: "action",
          key: "edit",
          label: t("profile.lists.edit"),
          icon: Edit,
          onPress: handleEdit,
        },
        {
          kind: "action",
          key: "pin",
          label: t("profile.lists.pin"),
          icon: Pin,
          variant: isPinned ? "brand" : "default",
          onPress: handlePin,
        },
        {
          kind: "action",
          key: "like",
          label: isLiked ? t("listDetail.liked") : t("listDetail.like"),
          icon: Heart,
          variant: isLiked ? "brand" : "default",
          onPress: handleLike,
        },
        {
          kind: "action",
          key: "delete",
          label: t("profile.lists.delete"),
          icon: Trash2,
          variant: "destructive",
          onPress: () => setIsDeleteModalOpen(true),
        },
      ];
    }

    return [
      {
        kind: "action",
        key: "like",
        label: isLiked ? t("listDetail.liked") : t("listDetail.like"),
        icon: Heart,
        variant: isLiked ? "brand" : "default",
        onPress: handleLike,
      },
      {
        kind: "action",
        key: "save",
        label: isSaved ? t("listDetail.savedList") : t("listDetail.saveList"),
        icon: Bookmark,
        variant: isSaved ? "brand" : "default",
        onPress: handleSave,
      },
      {
        kind: "action",
        key: "follow",
        label: isFollowed
          ? t("profile.lists.following")
          : t("profile.lists.follow"),
        icon: UserPlus,
        variant: isFollowed ? "brand" : "default",
        onPress: handleFollowToggle,
      },
    ];
  }, [
    t,
    isOwnList,
    isPinned,
    isLiked,
    isSaved,
    isFollowed,
    handleEdit,
    handlePin,
    handleLike,
    handleSave,
    handleFollowToggle,
  ]);

  const actionIconBackingStyle = {
    backgroundColor:
      colorScheme === "dark" ? "rgba(17,24,39,0.8)" : "rgba(255,255,255,0.9)",
  };

  return (
    <>
      <WhiteBox className="p-0">
        <Pressable
          onPress={handleCardPress}
          accessibilityRole="button"
          className="cursor-pointer"
        >
          {heroImageUrl ? (
            <CardHero
              imageUrl={heroImageUrl}
              title={list.name}
              subtitle={formatListCategoriesSubtitle(
                list.categories,
                list.others_name,
              )}
              aspectClassName="h-64"
              topLeft={
                showNewBadge ? (
                  <View className="rounded-full bg-brand px-2.5 py-1">
                    <Text className="font-geist-semibold text-[10px] tracking-wide text-white">
                      {t("home.newBadge", {
                        time: formatRelativeTimeUpper(list.created_at),
                      })}
                    </Text>
                  </View>
                ) : null
              }
            />
          ) : null}

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
            </View>

            {!heroImageUrl ? (
              <Text
                className="mb-1 font-geist-bold text-lg text-ink dark:text-gray-100"
                numberOfLines={2}
              >
                {list.name}
              </Text>
            ) : null}

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
        </Pressable>

        <View
          className="absolute right-2 top-2 z-10 rounded-full"
          style={actionIconBackingStyle}
        >
          <CardOptionsMenu items={menuItems} isDeleting={isDeleting} />
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

      <ConfirmDeleteModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        isLoading={isDeleting}
      />
    </>
  );
}
