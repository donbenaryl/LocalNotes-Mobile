import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  Edit,
  Heart,
  MessageCircle,
  Pin,
  Trash2,
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
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { PickPreviewImage } from "@/components/ui/PickPreviewImage";
import { ListCommentsSheet } from "@/components/PageComponents/List/ListDetails/ListCommentsSheet";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useListFormStore } from "@/stores/useListFormStore";
import { getListMatchPercent } from "@/utils/matchScore";
import { formatListLocation } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getDominantPersonalityColor } from "@/utils/personalityRing";
import { isOthersCategoryName } from "@/utils/listCategories";
import {
  formatRelativeTimeUpper,
  isCreatedWithinHours,
} from "@/utils/time";
import type { Item, ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import type { ScreenRect } from "@/types/layout";
import { WhiteBox } from "./WhiteBox";
import { FollowButton } from "./FollowButton";

const PREVIEW_PICK_LIMIT = 2;

interface ListCardDetailedProps {
  list: ListItemDAO;
  variant?: "default" | "forYou";
  onDeleted?: (id: string) => void;
  /** Profile accordion only; default false → always expanded */
  collapsible?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
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

function mapItemToListItemPublic(
  item: Item,
  list: ListItemDAO,
  isOwner: boolean,
): ListItemPublic {
  return {
    id: item.id,
    business_name: getPickName(item),
    business_id: item.business?.id ?? null,
    is_verified: Boolean(item.business),
    is_favorite: item.is_favorite ?? false,
    is_owner: isOwner,
    owner: item.owner ?? list.account,
    description: item.description ?? "",
    tags: item.tags ?? [],
    categories: item.categories ?? [],
    others_name: item.others_name,
    images: item.images ?? [],
    list_usage_count: 0,
    location: item.location ?? list.location ?? null,
  };
}

interface PickPreviewRowProps {
  item: Item;
  index: number;
  personalityColor?: Record<string, number> | null;
  onPress: () => void;
}

function PickPreviewRow({
  item,
  index,
  personalityColor,
  onPress,
}: PickPreviewRowProps) {
  const name = getPickName(item);
  if (!name) return null;

  const imageUrl =
    resolveImageUrl(item.images?.[0]?.url) ??
    resolveImageUrl(item.business?.logo);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      className="cursor-pointer flex-row items-center gap-3 py-1"
    >
      <PickPreviewImage
        imageUrl={imageUrl}
        index={index}
        personalityColor={personalityColor}
      />

      <View className="min-w-0 flex-1 justify-center">
        <Text
          className="font-geist-semibold text-[14.5px] text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {name}
        </Text>
        {item.description ? (
          <Text
            className="mt-0.5 font-geist text-[13px] text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {item.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

interface ListCardCollapsedBannerProps {
  title: string;
  meta: string;
  imageUrl: string | null;
  accentColor: string;
  accessibilityLabel: string;
  onExpand: () => void;
  sideAction: ReactNode;
}

function ListCardCollapsedBanner({
  title,
  meta,
  imageUrl,
  accentColor,
  accessibilityLabel,
  onExpand,
  sideAction,
}: ListCardCollapsedBannerProps) {
  return (
    <View className="h-[92px] overflow-hidden rounded-2xl bg-[#3a2c22]">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
      ) : (
        <View
          className="absolute inset-0"
          style={{ backgroundColor: accentColor }}
        />
      )}

      <View
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(12,10,8,0.45)" }}
        pointerEvents="none"
      />

      <Pressable
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: false }}
        className="absolute inset-0 z-[1] cursor-pointer"
      />

      <View
        className="absolute bottom-0 left-3.5 right-[118px] top-0 z-[2] justify-center"
        pointerEvents="none"
      >
        <Text
          className="font-geist-bold text-2xl text-white"
          numberOfLines={2}
          style={{ textShadowColor: "rgba(0,0,0,0.3)", textShadowRadius: 8 }}
        >
          {title}
        </Text>
        <Text
          className="mt-0.5 text-white/90"
          numberOfLines={1}
        >
          {meta}
        </Text>
      </View>

      <View className="absolute right-1.5 top-1 z-[2] flex-row items-center gap-1.5">
        {sideAction}
      </View>
    </View>
  );
}

export function ListCardDetailed({
  list,
  onDeleted,
  collapsible = false,
  expanded = true,
  onExpand,
  onCollapse,
}: ListCardDetailedProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { user } = useAuthStore();

  const isOwnList = user?.id === list.account.id;
  const picksCount = list.items?.length ?? 0;
  const locationLabel = formatListLocation(list.location);
  const cityLabel = list.location?.city ?? locationLabel;
  const heroImageUrl = getHeroImageUrl(list);
  const allItems = list.items ?? [];
  const showNewBadge = isCreatedWithinHours(list.created_at, 24);
  const accentColor = getDominantPersonalityColor(
    list.account.personality_color,
  );
  // Server-computed; clients pick personality vs overall via MATCH_SCORE_MODE.
  const personalityMatch = getListMatchPercent(list);

  const [isSaved, setIsSaved] = useState(list.is_saved);
  const [isLiked, setIsLiked] = useState(list.is_liked);
  const [isPinned, setIsPinned] = useState(list.is_pinned);
  const [isFollowed, setIsFollowed] = useState(list.account_is_followed);
  const [saves, setSaves] = useState(list.saves ?? 0);
  const [likes, setLikes] = useState<number>(list.likes ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [picksExpanded, setPicksExpanded] = useState(false);
  const [selectedPick, setSelectedPick] = useState<ListItemPublic | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(list.comments ?? 0);
  const [commentsOriginRect, setCommentsOriginRect] = useState<ScreenRect | null>(
    null,
  );
  const cardRef = useRef<View>(null);

  const visibleItems = picksExpanded
    ? allItems
    : allItems.slice(0, PREVIEW_PICK_LIMIT);
  const extraPickCount = Math.max(0, picksCount - PREVIEW_PICK_LIMIT);

  useEffect(() => {
    setIsSaved(list.is_saved);
    setIsLiked(list.is_liked);
    setSaves(list.saves ?? 0);
    setLikes(list.likes ?? 0);
  }, [list.id, list.is_saved, list.is_liked, list.saves, list.likes]);

  useEffect(() => {
    setIsPinned(list.is_pinned);
  }, [list.id, list.is_pinned]);

  useEffect(() => {
    setIsFollowed(list.account_is_followed);
  }, [list.id, list.account_is_followed]);

  useEffect(() => {
    setPicksExpanded(false);
  }, [list.id]);

  useEffect(() => {
    setCommentsCount(list.comments ?? 0);
    setIsCommentsOpen(false);
  }, [list.id, list.comments]);

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
    const previousLikes = likes;
    const nextLiked = !previousLiked;
    const nextLikes = nextLiked
      ? previousLikes + 1
      : Math.max(0, previousLikes - 1);

    setIsLiked(nextLiked);
    setLikes(nextLikes);

    try {
      await listService.likeUnlikeList(list.id);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, isLiked, likes, list.id]);

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

  // Measure the card on screen first so the comments preview can morph out of it.
  const handleOpenComments = useCallback(() => {
    const node = cardRef.current;
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
  }, []);

  const handlePickPress = useCallback(
    (item: Item) => {
      setSelectedPick(mapItemToListItemPublic(item, list, isOwnList));
    },
    [list, isOwnList],
  );

  const ownMenuItems = useMemo((): CardOptionsMenuItem[] => {
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
  }, [t, isPinned, isLiked, handleEdit, handlePin, handleLike]);

  const actionIconBackingStyle = {
    backgroundColor:
      colorScheme === "dark" ? "rgba(17,24,39,0.8)" : "rgba(255,255,255,0.94)",
  };

  const iconMuted = colorScheme === "dark" ? "#9CA3AF" : "#57534E";
  const iconDim = colorScheme === "dark" ? "#6B7280" : "#A8A29E";

  const isCollapsed = collapsible && !expanded;
  const whereLabel = cityLabel || list.account.name;
  const collapsedMeta = t("profile.lists.placesMeta", {
    count: picksCount,
    where: whereLabel,
  });

  const sideAction = isOwnList ? (
    <View className="rounded-full" style={actionIconBackingStyle}>
      <CardOptionsMenu items={ownMenuItems} isDeleting={isDeleting} />
    </View>
  ) : (
    <Pressable
      onPress={() => void handleSave()}
      disabled={isSaving}
      accessibilityRole="button"
      accessibilityLabel={
        isSaved ? t("listDetail.savedList") : t("home.saveList")
      }
      accessibilityState={{ selected: isSaved }}
      className="h-11 w-11 cursor-pointer items-center justify-center"
      hitSlop={4}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          isSaved ? "bg-brand" : ""
        }`}
        style={isSaved ? undefined : actionIconBackingStyle}
      >
        <Bookmark
          size={16}
          color={
            isSaved
              ? "#FFFFFF"
              : colorScheme === "dark"
                ? "#F9FAFB"
                : "#1C1917"
          }
          fill={isSaved ? "#FFFFFF" : "transparent"}
        />
      </View>
    </Pressable>
  );

  return (
    <>
      {/* collapsable={false} keeps the node measurable on Android. */}
      <View ref={cardRef} collapsable={false}>
        {isCollapsed ? (
          <ListCardCollapsedBanner
            title={list.name}
            meta={collapsedMeta}
            imageUrl={heroImageUrl}
            accentColor={accentColor}
            accessibilityLabel={t("profile.lists.expandList", {
              title: list.name,
              count: picksCount,
            })}
            onExpand={() => onExpand?.()}
            sideAction={sideAction}
          />
        ) : (
          <>
            <WhiteBox className="overflow-hidden p-0">
              {heroImageUrl ? (
                <CardHero
                  imageUrl={heroImageUrl}
                  title={list.name}
                  subtitle={formatListCategoriesSubtitle(
                    list.categories,
                    list.others_name,
                  )}
                  aspectClassName="aspect-[16/10.5]"
                />
              ) : null}

              {/* Top-left overlays live on the card shell so they show with or without a hero. */}
              <View
                className="absolute left-2 top-2 z-10 gap-1.5"
                pointerEvents="none"
              >
                {!isOwnList ? (
                  <PersonalityMatchPill
                    variant="overlay"
                    percent={personalityMatch}
                  />
                ) : null}
                {showNewBadge ? (
                  <View className="self-start rounded-full bg-brand px-2.5 py-1">
                    <Text className="font-geist-semibold text-[10px] tracking-wide text-white">
                      {t("home.newBadge", {
                        time: formatRelativeTimeUpper(list.created_at),
                      })}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="absolute right-2 top-2 z-10">{sideAction}</View>

              <View
                className={
                  !heroImageUrl &&
                  ((!isOwnList &&
                    personalityMatch != null &&
                    personalityMatch > 0) ||
                    showNewBadge)
                    ? "px-4 pt-10"
                    : "px-4 pt-2.5"
                }
              >
                <View className="mb-2 flex-row items-center gap-2.5">
                  <Avatar
                    name={list.account.name}
                    src={resolveImageUrl(list.account.profile_image) ?? undefined}
                    size="sm"
                    userId={list.account.id}
                    gradientColors={[accentColor]}
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      className="font-geist-semibold text-[14.5px] text-ink dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {list.account.name}
                    </Text>
                    {list.personality_name || list.account.personality_name ? (
                      <Text
                        className="shrink font-fraunces text-[13px] italic"
                        style={{ color: accentColor }}
                        numberOfLines={1}
                      >
                        {list.personality_name ?? list.account.personality_name}
                      </Text>
                    ) : null}
                  </View>

                  {!isOwnList ? (
                    <View className={!heroImageUrl ? "mr-8" : ""}>
                      <FollowButton
                        userId={list.account.id}
                        initialIsFollowed={list.account_is_followed}
                        isFollowed={isFollowed}
                        onToggle={handleFollowToggle}
                        loading={isFollowLoading}
                        variant="outline"
                      />
                    </View>
                  ) : null}
                </View>

                {!heroImageUrl ? (
                  <Text
                    className="mb-1 font-geist-extrabold text-[22px] leading-7 text-ink dark:text-gray-100"
                    numberOfLines={2}
                  >
                    {list.name}
                  </Text>
                ) : null}

                {list.notes ? (
                  <Text className="mb-3 font-geist text-[14.5px] leading-5 text-gray-500 dark:text-gray-400">
                    {stripHtml(list.notes)}
                  </Text>
                ) : null}

                {visibleItems.length > 0 ? (
                  <View className="border-t border-gray-100 dark:border-gray-800">
                    {visibleItems.map((item, index) => (
                      <View
                        key={item.id}
                        className={
                          index > 0
                            ? "border-t border-gray-100 dark:border-gray-800"
                            : undefined
                        }
                      >
                        <PickPreviewRow
                          item={item}
                          index={index}
                          personalityColor={list.account.personality_color}
                          onPress={() => handlePickPress(item)}
                        />
                      </View>
                    ))}

                    {extraPickCount > 0 ? (
                      <Pressable
                        onPress={() => setPicksExpanded((prev) => !prev)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: picksExpanded }}
                        className="-mx-4 cursor-pointer flex-row items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800"
                      >
                        <View className="h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-tint">
                          <Text className="font-geist-extrabold text-[12px] text-brand">
                            +
                          </Text>
                        </View>
                        <Text className="font-geist-semibold text-[13.5px] text-brand">
                          {picksExpanded
                            ? t("home.showLessPicks")
                            : t("home.seeMorePicks", { count: extraPickCount })}
                        </Text>
                        <ChevronRight
                          size={16}
                          color="#FF6B1A"
                          style={{
                            transform: [
                              { rotate: picksExpanded ? "90deg" : "0deg" },
                            ],
                          }}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View className="flex-row items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
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
                    color={isSaved ? "#FF6B1A" : iconMuted}
                    fill={isSaved ? "#FF6B1A" : "transparent"}
                  />
                  <Text
                    className={`font-geist-semibold text-[12.5px] ${
                      isSaved
                        ? "text-brand"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {t("home.savesCountShort", { count: saves })}
                  </Text>
                </Pressable>

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
                    color={isLiked ? "#FF6B1A" : iconMuted}
                    fill={isLiked ? "#FF6B1A" : "transparent"}
                  />
                  <Text
                    className={`font-geist-semibold text-[12.5px] ${
                      isLiked
                        ? "text-brand"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
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
                  <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
                    {t("home.commentsCountShort", { count: commentsCount })}
                  </Text>
                </Pressable>

                <View className="flex-1" />

                {cityLabel ? (
                  <Text
                    className="max-w-[45%] font-geist-medium text-[12.5px] text-gray-400"
                    numberOfLines={1}
                    style={{ color: iconDim }}
                  >
                    {cityLabel}
                  </Text>
                ) : null}
              </View>
            </WhiteBox>

            {collapsible ? (
              <Pressable
                onPress={() => onCollapse?.()}
                accessibilityRole="button"
                accessibilityLabel={t("profile.lists.collapseList", {
                  title: list.name,
                })}
                accessibilityState={{ expanded: true }}
                className="min-h-10 cursor-pointer flex-row items-center justify-center gap-1.5"
                hitSlop={4}
              >
                <Text className="font-geist-semibold text-[12.5px] text-gray-400 dark:text-gray-500">
                  {t("profile.lists.showLess")}
                </Text>
                <ChevronDown
                  size={15}
                  color={iconDim}
                  style={{ transform: [{ rotate: "-90deg" }] }}
                />
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <ConfirmDeleteModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        isLoading={isDeleting}
      />

      {selectedPick ? (
        <PickDetailModal
          visible
          onClose={() => setSelectedPick(null)}
          data={selectedPick}
        />
      ) : null}

      <ListCommentsSheet
        visible={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        list={{ ...list, comments: commentsCount }}
        onCommentCountChange={setCommentsCount}
        originRect={commentsOriginRect}
      />
    </>
  );
}
