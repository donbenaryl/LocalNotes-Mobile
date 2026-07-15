import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Bookmark, Heart, UserPlus } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { MatchBadge } from "@/components/ui/MatchBadge";
import { PersonalityName } from "@/components/ui/PersonalityName";
import { CardOptionsMenu, type CardOptionsMenuItem } from "@/components/ui/CardOptionsMenu";
import accountService from "@/http/account-api/account.services";
import listService from "@/http/list-api/list.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { formatRelativeTime } from "@/utils/time";
import type { ListItemDAO } from "@/http/list-api/types";

interface ListDetailsHeaderProps {
  list: ListItemDAO;
  onSavedChange?: (isSaved: boolean, saves: number) => void;
}

export function ListDetailsHeader({
  list,
  onSavedChange,
}: ListDetailsHeaderProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnList = currentUserId === list.account.id;
  const gradientColors = getPersonalityGradientColors(
    list.account.personality_color,
  );
  const personalityName =
    list.personality_name ?? list.account.personality_name ?? null;
  const lastUpdated = list.updated_at ?? list.created_at;

  const [isSaved, setIsSaved] = useState(list.is_saved);
  const [saves, setSaves] = useState(list.saves ?? 0);
  const [isLiked, setIsLiked] = useState(list.is_liked);
  const [isFollowed, setIsFollowed] = useState(list.account_is_followed);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Keep save / like / follow sync paths independent so updating one
  // (e.g. save → parent/query) cannot clobber another local action state.
  useEffect(() => {
    setIsSaved(list.is_saved);
    setSaves(list.saves ?? 0);
  }, [list.id, list.is_saved, list.saves]);

  useEffect(() => {
    setIsLiked(list.is_liked);
  }, [list.id, list.is_liked]);

  useEffect(() => {
    setIsFollowed(list.account_is_followed);
  }, [list.id, list.account_is_followed]);

  const patchListDetailCache = useCallback(
    (patch: Partial<ListItemDAO>) => {
      queryClient.setQueryData<ListItemDAO | null>(
        ["list-detail", list.id],
        (prev) => (prev ? { ...prev, ...patch } : prev),
      );
    },
    [list.id, queryClient],
  );

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
    patchListDetailCache({ is_saved: nextSaved, saves: nextSaves });
    onSavedChange?.(nextSaved, nextSaves);

    try {
      await listService.saveUnsaveList(list.id);
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setIsSaved(previousSaved);
      setSaves(previousSaves);
      patchListDetailCache({ is_saved: previousSaved, saves: previousSaves });
      onSavedChange?.(previousSaved, previousSaves);
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    isOwnList,
    isSaved,
    saves,
    list.id,
    onSavedChange,
    patchListDetailCache,
  ]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    const previousLiked = isLiked;
    const nextLiked = !previousLiked;

    setIsLiked(nextLiked);
    patchListDetailCache({ is_liked: nextLiked });

    try {
      await listService.likeUnlikeList(list.id);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(previousLiked);
      patchListDetailCache({ is_liked: previousLiked });
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, isLiked, list.id, patchListDetailCache]);

  const handleFollowToggle = useCallback(async () => {
    if (isFollowLoading || isOwnList) return;
    setIsFollowLoading(true);
    const previousFollowed = isFollowed;
    const nextFollowed = !previousFollowed;

    setIsFollowed(nextFollowed);
    patchListDetailCache({ account_is_followed: nextFollowed });

    try {
      if (previousFollowed) {
        await accountService.unfollowUser(list.account.id);
      } else {
        await accountService.followUser(list.account.id);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      setIsFollowed(previousFollowed);
      patchListDetailCache({ account_is_followed: previousFollowed });
    } finally {
      setIsFollowLoading(false);
    }
  }, [
    isFollowLoading,
    isOwnList,
    isFollowed,
    list.account.id,
    patchListDetailCache,
  ]);

  const menuItems = useMemo((): CardOptionsMenuItem[] => {
    const items: CardOptionsMenuItem[] = [
      {
        kind: "action",
        key: "like",
        label: isLiked ? t("listDetail.liked") : t("listDetail.like"),
        icon: Heart,
        variant: isLiked ? "brand" : "default",
        onPress: handleLike,
      },
    ];

    if (!isOwnList) {
      items.push({
        kind: "action",
        key: "save",
        label: isSaved ? t("listDetail.savedList") : t("listDetail.saveList"),
        icon: Bookmark,
        variant: isSaved ? "brand" : "default",
        onPress: handleSave,
      });

      items.push({
        kind: "action",
        key: "follow",
        label: isFollowed
          ? t("profile.lists.following")
          : t("profile.lists.follow"),
        icon: UserPlus,
        variant: isFollowed ? "brand" : "default",
        onPress: handleFollowToggle,
      });
    }

    return items;
  }, [
    t,
    isLiked,
    isSaved,
    isFollowed,
    isOwnList,
    handleLike,
    handleSave,
    handleFollowToggle,
  ]);

  return (
    <View className="pb-2 border-b border-gray-200 dark:border-gray-700 mb-4">
      <PageHeader borderless rightChild={<CardOptionsMenu items={menuItems} />} />

      <View className="gap-3 px-6 pb-2">
        <View className="flex-row items-center gap-2.5">
          <Avatar
            name={list.account.name}
            src={resolveImageUrl(list.account.profile_image) ?? undefined}
            userId={list.account.id}
            size="md"
            gradientColors={gradientColors}
          />

          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-1">
              <Text
                className="font-geist-bold text-sm text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {list.account.name}
              </Text>
              {personalityName ? (
                <PersonalityName
                  name={personalityName}
                  personalityColor={list.account.personality_color}
                  variant="text"
                />
              ) : null}
            </View>
            <Text className="mt-0.5 font-geist text-[11.5px] text-gray-500 dark:text-gray-400">
              {t("listDetail.lastPickAdded", {
                time: formatRelativeTime(lastUpdated),
              })}
            </Text>
          </View>

          <MatchBadge
            userId={list.account.id}
            personalityColor={list.account.personality_color}
            enabled={!isOwnList}
          />
        </View>
      </View>
    </View>
  );
}
