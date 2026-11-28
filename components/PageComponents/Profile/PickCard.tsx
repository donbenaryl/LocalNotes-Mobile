import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  BadgeCheck,
  Bookmark,
  Edit,
  Flag,
  Heart,
  Send,
  Trash2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CardHero } from "@/components/ui/CardHero";
import {
  CardOptionsMenu,
  type CardOptionsMenuItem,
} from "@/components/ui/CardOptionsMenu";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { ShareToUsersSheet } from "@/components/ui/ShareToUsersSheet";
import { ReportUserSheet } from "@/components/PageComponents/Safety/ReportUserSheet";
import { PickDetailModal } from "./PickDetailModal";
import { PickFormModal } from "./PickFormModal";
import { brandColor } from "@/constants/colors";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getEmbeddedMatchPercent } from "@/utils/matchScore";
import { resolveUserLabels } from "@/utils/userDisplayName";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import type { ListItemImage, ListItemPublic } from "@/http/list-api/types";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { cn } from "@/utils/cn";
import { isOthersCategoryName } from "@/utils/listCategories";
import type { ViewOrigin } from "@/http/types";

function patchPickListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  pickId: string,
  patch: Pick<ListItemPublic, "is_liked" | "likes">,
) {
  const patchList = (previous: ListItemPublic[] | undefined) => {
    if (!previous) return previous;
    return previous.map((item) =>
      item.id === pickId
        ? { ...item, is_liked: patch.is_liked, likes: patch.likes }
        : item,
    );
  };

  queryClient.setQueriesData<ListItemPublic[]>(
    { queryKey: ["profile-picks"] },
    patchList,
  );
  queryClient.setQueriesData<ListItemPublic[]>(
    { queryKey: ["profile-business-picks"] },
    patchList,
  );
  queryClient.setQueriesData<ListItemPublic[]>(
    { queryKey: ["home-picks"] },
    patchList,
  );
  queryClient.setQueryData<ListItemPublic | null>(
    ["list-item", pickId],
    (previous) =>
      previous
        ? { ...previous, is_liked: patch.is_liked, likes: patch.likes }
        : previous,
  );
}

function formatCategoryName(
  category: string,
  othersName: ListItemPublic["others_name"],
): string {
  return isOthersCategoryName(category) ? (othersName ?? category) : category;
}

interface PickCardProps {
  data: ListItemPublic;
  onRefresh?: () => void;
  readOnly?: boolean;
  viewOrigin?: ViewOrigin;
}

function PickCardCategoriesScroll({
  categories,
  othersName,
  textClassName,
  scrollable = true,
}: {
  categories: string[];
  othersName: ListItemPublic["others_name"];
  textClassName: string;
  scrollable?: boolean;
}) {
  if (categories.length === 0) return null;

  const label = categories
    .map((category) => formatCategoryName(category, othersName))
    .join(" · ");

  if (!scrollable) {
    return (
      <Text className={textClassName} numberOfLines={1}>
        {label}
      </Text>
    );
  }

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      hitSlop={{ top: 12, bottom: 12 }}
      style={{ width: "100%" }}
    >
      <Text className={textClassName}>{label}</Text>
    </ScrollView>
  );
}

interface PickCardOwnerRowProps {
  data: ListItemPublic;
  isLiked: boolean;
  likes: number;
  isLiking: boolean;
  iconMuted: string;
  iconBrand: string;
  likeLabel: string;
  shareLabel: string;
  onLike: () => void;
  onShare: () => void;
}

function PickCardOwnerRow({
  data,
  isLiked,
  likes,
  isLiking,
  iconMuted,
  iconBrand,
  likeLabel,
  shareLabel,
  onLike,
  onShare,
}: PickCardOwnerRowProps) {
  const ownerLabels = data.owner ? resolveUserLabels(data.owner) : null;

  return (
    <View className="flex-row items-center justify-between gap-2 pt-1">
      <View className="flex-row items-center gap-1.5 min-w-0 flex-1">
        {data.owner && ownerLabels ? (
          <Avatar
            name={ownerLabels.primary}
            src={resolveImageUrl(data.owner.profile_image) ?? undefined}
            size="xs2"
            userId={data.owner.id}
          />
        ) : null}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onLike();
          }}
          disabled={isLiking}
          accessibilityRole="button"
          accessibilityLabel={likeLabel}
          accessibilityState={{ disabled: isLiking, selected: isLiked }}
          className="cursor-pointer flex-row items-center gap-1.5"
          hitSlop={4}
        >
          <Heart
            size={16}
            color={isLiked ? iconBrand : iconMuted}
            fill={isLiked ? iconBrand : "transparent"}
          />
          <Text
            className={cn(
              "font-geist-semibold text-md",
              isLiked
                ? "text-brand dark:text-dk-text"
                : "text-gray-500 dark:text-dk-muted",
            )}
          >
            {likes}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onShare();
        }}
        accessibilityRole="button"
        accessibilityLabel={shareLabel}
        className="cursor-pointer shrink-0"
        hitSlop={4}
      >
        <Send size={16} color={iconMuted} />
      </Pressable>
    </View>
  );
}

interface PickCardBodyProps {
  data: ListItemPublic;
  thumbnails: ListItemImage[];
  padForMatchOverlay?: boolean;
  onOpenDetail: () => void;
  isLiked: boolean;
  likes: number;
  isLiking: boolean;
  iconMuted: string;
  iconBrand: string;
  likeLabel: string;
  shareLabel: string;
  onLike: () => void;
  onShare: () => void;
}

function PickCardBody({
  data,
  thumbnails,
  padForMatchOverlay = false,
  onOpenDetail,
  isLiked,
  likes,
  isLiking,
  iconMuted,
  iconBrand,
  likeLabel,
  shareLabel,
  onLike,
  onShare,
}: PickCardBodyProps) {
  const { colorScheme } = useColorScheme();
  const primaryImage = thumbnails[0];
  const heroImageUrl = primaryImage
    ? (resolveImageUrl(primaryImage.url) ?? primaryImage.url)
    : null;

  const showTitleInBody = !heroImageUrl && Boolean(data.business_name);
  const showCategoriesInBody = !heroImageUrl && data.categories.length > 0;

  const bodyPaddingClass =
    !heroImageUrl && padForMatchOverlay ? "p-3 pt-10 gap-1" : "p-3 gap-1";

  const verifiedBadge = data.is_verified ? (
    <BadgeCheck size={14} color={colorScheme === "dark" ? "#FFFFFF" : "#1A1714"} />
  ) : null;

  return (
    <View className="w-full">
      {heroImageUrl ? (
        <CardHero
          imageUrl={heroImageUrl}
          title={data.business_name ?? ""}
          onPress={onOpenDetail}
          titleAccessory={verifiedBadge}
          subtitleNode={
            data.categories.length > 0 ? (
              <PickCardCategoriesScroll
                categories={data.categories}
                othersName={data.others_name}
                textClassName="text-sm text-white"
              />
            ) : undefined
          }
          aspectClassName="aspect-[16/12] rounded-t-2xl"
          titleSize="text-2xl"
          subtitleSize="text-sm"
        />
      ) : null}

      <View className={bodyPaddingClass}>
        {showTitleInBody ? (
          <View className="flex-row items-center gap-1.5 pr-10">
            <Text
              className="text-sm font-geist-medium text-ink dark:text-dk-text flex-1"
              numberOfLines={1}
            >
              {data.business_name}
            </Text>
            {verifiedBadge}
          </View>
        ) : null}

        {showCategoriesInBody ? (
          <PickCardCategoriesScroll
            categories={data.categories}
            othersName={data.others_name}
            textClassName="text-xs text-gray-400 dark:text-dk-faint"
            scrollable={false}
          />
        ) : null}

        <View className="gap-1">
          {data.tags.length > 0 && (
            <View className="flex-row flex-wrap items-center gap-1 border-b border-gray-200 dark:border-dk-border pb-3">
              {data.tags.map((tag) => (
                <Badge key={tag.id} label={tag.name} variant="primary" />
              ))}
            </View>
          )}

          <PickCardOwnerRow
            data={data}
            isLiked={isLiked}
            likes={likes}
            isLiking={isLiking}
            iconMuted={iconMuted}
            iconBrand={iconBrand}
            likeLabel={likeLabel}
            shareLabel={shareLabel}
            onLike={onLike}
            onShare={onShare}
          />
        </View>
      </View>
    </View>
  );
}

export function PickCard({
  data,
  onRefresh,
  readOnly = false,
  viewOrigin,
}: PickCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const canManage = !readOnly && data.is_owner;
  const thumbnails = data.images ?? [];
  // Hidden on your own picks; otherwise shown; a missing score renders nothing (pill returns null).
  const showMatch = !data.is_owner;
  const personalityMatch = getEmbeddedMatchPercent(data.owner);
  const shareTitle =
    data.business_name?.trim() || t("profile.picks.untitled");
  const primaryImageUrl = thumbnails[0]
    ? (resolveImageUrl(thumbnails[0].url) ?? thumbnails[0].url)
    : null;
  const isDark = colorScheme === "dark";
  const iconMuted = isDark ? "#A79E92" : "#4b4f57";
  const iconBrand = brandColor(isDark);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(data.is_favorite ?? false);
  const [isLiked, setIsLiked] = useState(data.is_liked ?? false);
  const [likes, setLikes] = useState(data.likes ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setIsFavorite(data.is_favorite ?? false);
  }, [data.id, data.is_favorite]);

  useEffect(() => {
    setIsLiked(data.is_liked ?? false);
    setLikes(data.likes ?? 0);
  }, [data.id, data.is_liked, data.likes]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error, data: response } = await listService.deleteListItem(data.id);
    setIsDeleting(false);

    if (error) {
      const body =
        (response as unknown as { lists?: { name: string }[]; message?: string }) ?? {};
      const listNames = body.lists?.map((l) => l.name).join(", ");
      showToast({
        type: "error",
        message: listNames
          ? t("profile.picks.deleteInUse", { lists: listNames })
          : (error.message ?? t("profile.picks.deleteError")),
      });
      setIsDeleteOpen(false);
      return;
    }

    setIsDeleteOpen(false);
    onRefresh?.();
  };

  const handleToggleFavorite = useCallback(async () => {
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    const { error } = await listService.setListItemFavorite(data.id, nextFavorite);

    if (error) {
      setIsFavorite(!nextFavorite);
      showToast({ type: "error", message: error.message ?? t("profile.picks.favoriteError") });
    }
  }, [data.id, isFavorite, showToast, t]);

  const applyLikePatch = useCallback(
    (nextLiked: boolean, nextLikes: number) => {
      patchPickListCaches(queryClient, data.id, {
        is_liked: nextLiked,
        likes: nextLikes,
      });
    },
    [data.id, queryClient],
  );

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
    applyLikePatch(nextLiked, nextLikes);

    try {
      const { error } = await listService.likeUnlikeListItem(data.id);
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Failed to toggle pick like:", error);
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      applyLikePatch(previousLiked, previousLikes);
    } finally {
      setIsLiking(false);
    }
  }, [applyLikePatch, data.id, isLiked, isLiking, likes]);

  const menuItems = useMemo((): CardOptionsMenuItem[] => {
    const favoriteItem: CardOptionsMenuItem = {
      kind: "action",
      key: "favorite",
      label: isFavorite ? t("profile.picks.saved") : t("profile.picks.save"),
      icon: Bookmark,
      variant: isFavorite ? "brand" : "default",
      onPress: () => void handleToggleFavorite(),
    };

    if (canManage) {
      return [
        {
          kind: "action",
          key: "edit",
          label: t("profile.lists.edit"),
          icon: Edit,
          onPress: () => setIsEditOpen(true),
        },
        favoriteItem,
        {
          kind: "action",
          key: "delete",
          label: t("profile.lists.delete"),
          icon: Trash2,
          variant: "destructive",
          onPress: () => setIsDeleteOpen(true),
        },
      ];
    }

    const items: CardOptionsMenuItem[] = [favoriteItem];

    if (!data.is_owner && data.owner) {
      items.push({
        kind: "action",
        key: "report",
        label: t("listDetail.report"),
        icon: Flag,
        variant: "destructive",
        onPress: () => setReportOpen(true),
      });
    }

    return items;
  }, [canManage, data.is_owner, data.owner, handleToggleFavorite, isFavorite, t]);

  return (
    <>
      <Pressable
        onPress={() => setIsDetailOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={data.business_name ?? data.description ?? undefined}
        className="w-full cursor-pointer"
      >
        <WhiteBox className="p-0">
          <PickCardBody
            data={data}
            thumbnails={thumbnails}
            padForMatchOverlay={showMatch}
            onOpenDetail={() => setIsDetailOpen(true)}
            isLiked={isLiked}
            likes={likes}
            isLiking={isLiking}
            iconMuted={iconMuted}
            iconBrand={iconBrand}
            likeLabel={isLiked ? t("listDetail.liked") : t("listDetail.like")}
            shareLabel={t("listDetail.share")}
            onLike={() => void handleLike()}
            onShare={() => setShareOpen(true)}
          />

          {showMatch ? (
            <View className="absolute left-2 top-2 z-10" pointerEvents="none">
              <PersonalityMatchPill
                variant="overlayCompact"
                percent={personalityMatch}
              />
            </View>
          ) : null}

          <View className="absolute right-2 top-2 z-10 rounded-full bg-white/90 dark:bg-dk-page/80">
            <CardOptionsMenu items={menuItems} isDeleting={isDeleting} />
          </View>
        </WhiteBox>
      </Pressable>

      <PickDetailModal
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={data}
        viewOrigin={viewOrigin}
      />

      {canManage ? (
        <>
          <PickFormModal
            visible={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onCreated={() => {}}
            editingItem={data}
            onUpdated={() => {
              setIsEditOpen(false);
              onRefresh?.();
            }}
          />

          <ConfirmDeleteModal
            visible={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={() => void handleDelete()}
            isLoading={isDeleting}
            title={t("profile.picks.deletePickTitle")}
            message={t("profile.picks.deletePickMessage")}
          />
        </>
      ) : null}

      {!data.is_owner && data.owner ? (
        <ReportUserSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          userId={data.owner.id}
          displayName={resolveUserLabels(data.owner).primary}
          contentType="pick"
          contentId={data.id}
        />
      ) : null}

      <ShareToUsersSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        target={data.id ? { kind: "pick", itemId: data.id } : null}
        shareInfo={{
          title: shareTitle,
          subtitle: data.description ?? undefined,
          imageUrl: primaryImageUrl,
        }}
      />
    </>
  );
}
