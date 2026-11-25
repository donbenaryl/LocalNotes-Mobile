import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import { Pressable, Text, View } from "react-native";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ListCommentsSheet } from "@/components/PageComponents/List/ListDetails/ListCommentsSheet";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { getPickImageUrl } from "@/components/ui/ListPickSection";
import { ShareToUsersSheet } from "@/components/ui/ShareToUsersSheet";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO } from "@/http/list-api/types";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ScreenRect } from "@/types/layout";
import { brandColor } from "@/constants/colors";
import { cn } from "@/utils/cn";
import { resolveImageUrl } from "@/utils/httpHelpers";

function getListShareImageUrl(list: ListItemDAO): string | null {
  const cover = resolveImageUrl(list.image_url);
  if (cover) return cover;

  for (const item of list.items ?? []) {
    const itemImage = getPickImageUrl(item);
    if (itemImage) return itemImage;
  }

  return null;
}

interface ListEngagementRowProps {
  list: ListItemDAO;
  locationLabel?: string | null;
  /** When set, shown on the right instead of locationLabel. */
  matchPercent?: number | null;
  className?: string;
  commentsOriginRef?: RefObject<View | null>;
}

export function ListEngagementRow({
  list,
  locationLabel,
  matchPercent,
  className,
  commentsOriginRef,
}: ListEngagementRowProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnList = currentUserId === list.account.id;

  const [isSaved, setIsSaved] = useState(list.is_saved);
  const [isLiked, setIsLiked] = useState(list.is_liked);
  const [saves, setSaves] = useState(list.saves ?? 0);
  const [likes, setLikes] = useState<number>(list.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(list.comments ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [commentsOriginRect, setCommentsOriginRect] = useState<ScreenRect | null>(
    null,
  );

  useEffect(() => {
    setIsSaved(list.is_saved);
    setIsLiked(list.is_liked);
    setSaves(list.saves ?? 0);
    setLikes(list.likes ?? 0);
  }, [list.id, list.is_saved, list.is_liked, list.saves, list.likes]);

  useEffect(() => {
    setCommentsCount(list.comments ?? 0);
  }, [list.id, list.comments]);

  useEffect(() => {
    setIsCommentsOpen(false);
  }, [list.id]);

  const patchListDetailCache = useCallback(
    (patch: Partial<ListItemDAO>) => {
      queryClient.setQueryData<ListItemDAO | null>(
        ["list-detail", list.id],
        (previous) => (previous ? { ...previous, ...patch } : previous),
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

    try {
      await listService.saveUnsaveList(list.id);
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setIsSaved(previousSaved);
      setSaves(previousSaves);
      patchListDetailCache({
        is_saved: previousSaved,
        saves: previousSaves,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    isOwnList,
    isSaved,
    saves,
    list.id,
    patchListDetailCache,
  ]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousLikes = likes;
    const nextLiked = !previousLiked;
    const nextLikes = nextLiked
      ? previousLikes + 1
      : Math.max(0, previousLikes - 1);

    setIsLiked(nextLiked);
    setLikes(nextLikes);
    patchListDetailCache({ is_liked: nextLiked, likes: nextLikes });

    try {
      await listService.likeUnlikeList(list.id);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      patchListDetailCache({
        is_liked: previousLiked,
        likes: previousLikes,
      });
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, isLiked, likes, list.id, patchListDetailCache]);

  const handleOpenComments = useCallback(() => {
    const node = commentsOriginRef?.current;
    if (!node) {
      setCommentsOriginRect(null);
      setIsCommentsOpen(true);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      setCommentsOriginRect(
        width > 0 && height > 0 ? { x, y, width, height } : null,
      );
      setIsCommentsOpen(true);
    });
  }, [commentsOriginRef]);

  const handleCommentCountChange = useCallback(
    (count: number) => {
      setCommentsCount(count);
      patchListDetailCache({ comments: count });
    },
    [patchListDetailCache],
  );

  const isDark = colorScheme === "dark";
  const iconMuted = isDark ? "#A79E92" : "#4b4f57";
  const iconDim = isDark ? "#8F877C" : "#9EA4AF";
  const iconBrand = brandColor(isDark);

  return (
    <>
      <View
        className={cn(
          "flex-row items-center gap-3",
          className,
        )}
      >
        <Pressable
          onPress={() => void handleLike()}
          disabled={isLiking}
          accessibilityRole="button"
          accessibilityLabel={
            isLiked ? t("listDetail.liked") : t("listDetail.like")
          }
          accessibilityState={{ disabled: isLiking, selected: isLiked }}
          className="cursor-pointer flex-row items-center gap-1.5"
          hitSlop={4}
        >
          <Heart
            size={13}
            color={isLiked ? iconBrand : iconMuted}
            fill={isLiked ? iconBrand : "transparent"}
          />
          <Text
            className={cn(
              "font-geist-semibold text-[12.5px]",
              isLiked
                ? "text-brand dark:text-dk-text"
                : "text-gray-500 dark:text-dk-muted",
            )}
          >
            {t("home.reactionsCountShort", { count: likes })}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleOpenComments}
          accessibilityRole="button"
          accessibilityLabel={t("listDetail.comments", {
            count: commentsCount,
          })}
          className="cursor-pointer flex-row items-center gap-1.5"
          hitSlop={4}
        >
          <MessageCircle size={13} color={iconMuted} />
          <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-dk-muted">
            {t("home.commentsCountShort", { count: commentsCount })}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsShareOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t("share.sheetTitle")}
          className="cursor-pointer flex-row items-center gap-1.5"
          hitSlop={4}
        >
          <Share2 size={13} color={iconMuted} />
        </Pressable>
        
        <Pressable
          onPress={() => void handleSave()}
          disabled={isSaving || isOwnList}
          accessibilityRole="button"
          accessibilityLabel={
            isSaved ? t("listDetail.savedList") : t("home.saveList")
          }
          accessibilityState={{
            disabled: isSaving || isOwnList,
            selected: isSaved,
          }}
          className="cursor-pointer flex-row items-center gap-1.5"
          hitSlop={4}
        >
          <Bookmark
            size={13}
            color={isSaved ? iconBrand : iconMuted}
            fill={isSaved ? iconBrand : "transparent"}
          />
          <Text
            className={cn(
              "font-geist-semibold text-[12.5px]",
              isSaved
                ? "text-brand dark:text-dk-text"
                : "text-gray-500 dark:text-dk-muted",
            )}
          >
            {t("home.savesCountShort", { count: saves })}
          </Text>
        </Pressable>

        <View className="flex-1" />

        {matchPercent !== undefined ? (
          <PersonalityMatchPill percent={matchPercent} />
        ) : locationLabel ? (
          <Text
            className="max-w-[45%] font-geist-medium text-[12.5px] text-gray-400"
            numberOfLines={1}
            style={{ color: iconDim }}
          >
            {locationLabel}
          </Text>
        ) : null}
      </View>

      <ListCommentsSheet
        visible={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        list={{
          ...list,
          comments: commentsCount,
          is_saved: isSaved,
          is_liked: isLiked,
          saves,
          likes,
        }}
        onCommentCountChange={handleCommentCountChange}
        originRect={commentsOriginRect}
      />

      <ShareToUsersSheet
        visible={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        target={{ kind: "list", listId: list.id }}
        shareInfo={{
          title: list.name,
          subtitle: list.account?.name,
          imageUrl: getListShareImageUrl(list),
        }}
      />
    </>
  );
}
