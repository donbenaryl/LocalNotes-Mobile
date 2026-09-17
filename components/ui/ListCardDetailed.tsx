import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  ChevronDown,
  Edit,
  Flag,
  Pin,
  Trash2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import accountService from "@/http/account-api/account.services";
import { CardHero } from "@/components/ui/CardHero";
import {
  type CardOptionsMenuItem,
} from "@/components/ui/CardOptionsMenu";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { ListAuthorRow } from "@/components/ui/ListAuthorRow";
import { ListDetailModal } from "@/components/ui/ListDetailModal";
import { ListEngagementRow } from "@/components/ui/ListEngagementRow";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { PickPreviewImage } from "@/components/ui/PickPreviewImage";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import { ReportUserSheet } from "@/components/PageComponents/Safety/ReportUserSheet";
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
import { WhiteBox } from "./WhiteBox";

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

function getPickImageUrl(item: Item): string | null {
  return (
    resolveImageUrl(item.images?.[0]?.url) ??
    resolveImageUrl(item.business?.logo)
  );
}

function getHeroImageUrl(list: ListItemDAO): string | null {
  const cover = resolveImageUrl(list.image_url);
  if (cover) return cover;

  for (const item of list.items ?? []) {
    const itemImage = getPickImageUrl(item);
    if (itemImage) return itemImage;
  }

  return null;
}

function getPickName(item: Item): string | null {
  return item.business?.name ?? item.unverified_business?.name ?? null;
}

function formatPickSubtitle(item: Item, fallbackCity?: string): string {
  const category = item.categories?.[0];
  const categoryLabel = category
    ? isOthersCategoryName(category)
      ? (item.others_name ?? category)
      : category
    : null;
  const city = item.location?.city || fallbackCity;

  return [categoryLabel, city].filter(Boolean).join(" · ");
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

export function mapItemToListItemPublic(
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

export function PickPreviewRow({
  item,
  index,
  personalityColor,
  onPress,
}: PickPreviewRowProps) {
  const name = getPickName(item);
  if (!name) return null;

  const imageUrl = getPickImageUrl(item);

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
  /** When set, shows PersonalityMatchPill top-left (same as expanded card). */
  matchPercent?: number | null;
}

function ListCardCollapsedBanner({
  title,
  meta,
  imageUrl,
  accentColor,
  accessibilityLabel,
  onExpand,
  matchPercent,
}: ListCardCollapsedBannerProps) {
  const showMatch = matchPercent !== undefined;

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

      {showMatch ? (
        <View
          className="absolute left-2 top-2 z-[2]"
          pointerEvents="none"
        >
          <PersonalityMatchPill variant="overlay" percent={matchPercent} />
        </View>
      ) : null}

      <View
        className={`absolute bottom-0 left-3.5 right-3.5 z-[2] justify-center ${
          showMatch ? "top-9" : "top-0"
        }`}
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
  const queryClient = useQueryClient();

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

  const [isPinned, setIsPinned] = useState(list.is_pinned);
  const [isFollowed, setIsFollowed] = useState(list.account_is_followed);
  const [isPinning, setIsPinning] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPick, setSelectedPick] = useState<ListItemPublic | null>(null);
  const [isPickDetailOpen, setIsPickDetailOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const cardRef = useRef<View>(null);

  const featuredPick =
    allItems.find((item) => getPickName(item) && getPickImageUrl(item)) ??
    allItems.find((item) => getPickName(item)) ??
    null;
  const featuredPickImageUrl = featuredPick
    ? getPickImageUrl(featuredPick)
    : null;
  const featuredPickSubtitle = featuredPick
    ? formatPickSubtitle(featuredPick, cityLabel)
    : "";
  const extraPickCount = Math.max(0, picksCount - 1);

  useEffect(() => {
    setIsPinned(list.is_pinned);
  }, [list.id, list.is_pinned]);

  useEffect(() => {
    setIsFollowed(list.account_is_followed);
  }, [list.id, list.account_is_followed]);

  const handleEdit = useCallback(() => {
    useListFormStore.getState().clearEditHydration();
    router.push(`/(app)/(stack)/lists/${list.id}/edit` as never);
  }, [list.id, router]);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await listService.deleteList(list.id);
      setIsDeleteModalOpen(false);
      setIsDetailOpen(false);
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

  const handlePickPress = useCallback(
    (item: Item) => {
      setSelectedPick(mapItemToListItemPublic(item, list, isOwnList));
      setIsPickDetailOpen(true);
    },
    [list, isOwnList],
  );

  const engagementMenuItems = useMemo((): CardOptionsMenuItem[] => {
    if (isOwnList) {
      return [
        {
          kind: "action",
          key: "edit",
          label: t("profile.lists.edit"),
          icon: Edit,
          onPress: handleEdit,
        },
        // {
        //   kind: "action",
        //   key: "pin",
        //   label: t("profile.lists.pin"),
        //   icon: Pin,
        //   variant: isPinned ? "brand" : "default",
        //   onPress: handlePin,
        // },
        // {
        //   kind: "action",
        //   key: "like",
        //   label: isLiked ? t("listDetail.liked") : t("listDetail.like"),
        //   icon: Heart,
        //   variant: list.is_liked ? "brand" : "default",
        // },
        // {
        //   kind: "action",
        //   key: "comment",
        //   label: t("listDetail.comment"),
        //   icon: MessageCircle,
        // },
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
      // {
      //   kind: "action",
      //   key: "like",
      //   label: list.is_liked ? t("listDetail.liked") : t("listDetail.like"),
      //   icon: Heart,
      //   variant: list.is_liked ? "brand" : "default",
      // },
      // {
      //   kind: "action",
      //   key: "comment",
      //   label: t("listDetail.comment"),
      //   icon: MessageCircle,
      // },
      // {
      //   kind: "action",
      //   key: "save",
      //   label: list.is_saved ? t("listDetail.savedList") : t("listDetail.saveList"),
      //   icon: Bookmark,
      //   variant: list.is_saved ? "brand" : "default",
      // },
      {
        kind: "action",
        key: "report",
        label: t("listDetail.report"),
        icon: Flag,
        variant: "destructive",
        onPress: () => setReportOpen(true),
      },
    ];
  }, [
    t,
    isPinned,
    isOwnList,
    handleEdit,
    handlePin,
  ]);

  const iconDim = colorScheme === "dark" ? "#6B7280" : "#A8A29E";

  const isCollapsed = collapsible && !expanded;
  const whereLabel = cityLabel || list.account.name;
  const collapsedMeta = t("profile.lists.placesMeta", {
    count: picksCount,
    where: whereLabel,
  });

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
            matchPercent={isOwnList ? undefined : personalityMatch}
          />
        ) : (
          <>
            <Pressable
              onPress={() => setIsDetailOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={list.name}
            >
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

                <View
                  className={
                    !heroImageUrl && (!isOwnList || showNewBadge)
                      ? "px-4 pt-10"
                      : "px-4 pt-2.5"
                  }
                >
                  <ListAuthorRow
                    account={list.account}
                    personalityName={list.personality_name}
                    accentColor={accentColor}
                    isOwnList={isOwnList}
                    initialIsFollowed={list.account_is_followed}
                    isFollowed={isFollowed}
                    onFollowToggle={handleFollowToggle}
                    followLoading={isFollowLoading}
                    menuItems={engagementMenuItems}
                    isDeleting={isDeleting}
                  />

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

                  {featuredPick ? (
                    <View className="mb-3 flex-row items-center gap-3 rounded-2xl bg-soft p-3 dark:bg-gray-800">
                      <Pressable
                        onPress={() => handlePickPress(featuredPick)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          getPickName(featuredPick) ?? undefined
                        }
                        className="min-w-0 flex-1 cursor-pointer flex-row items-center gap-3"
                      >
                        {featuredPickImageUrl ? (
                          <Image
                            source={{ uri: featuredPickImageUrl }}
                            className="h-12 w-12 shrink-0 rounded-xl"
                            resizeMode="cover"
                          />
                        ) : null}

                        <View className="min-w-0 flex-1 justify-center">
                          <Text
                            className="font-geist-semibold text-[15px] text-ink dark:text-gray-100"
                            numberOfLines={1}
                          >
                            {getPickName(featuredPick)}
                          </Text>
                          {featuredPickSubtitle ? (
                            <Text
                              className="mt-1 font-geist text-[13px] text-gray-500 dark:text-gray-400"
                              numberOfLines={1}
                            >
                              {featuredPickSubtitle}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>

                      {/* Additional Picks Counter */}
                      {extraPickCount > 0 ? (
                        <Pressable
                          onPress={() => setIsDetailOpen(true)}
                          accessibilityRole="button"
                          accessibilityLabel={t("home.morePicksBadge", {
                            count: extraPickCount,
                          })}
                          className="h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white dark:bg-gray-900"
                        >
                          <Text className="text-lg text-ink dark:text-gray-100">
                            {t("home.morePicksBadge", {
                              count: extraPickCount,
                            })}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                {/* Like Comment and Bookmark */}
                <ListEngagementRow
                  list={list}
                  locationLabel={cityLabel}
                  className="px-4 pb-3 pt-1"
                  commentsOriginRef={cardRef}
                />
              </WhiteBox>
            </Pressable>

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
          visible={isPickDetailOpen}
          onClose={() => setIsPickDetailOpen(false)}
          data={selectedPick}
        />
      ) : null}

      {!isOwnList ? (
        <ReportUserSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          userId={list.account.id}
          displayName={list.account.name}
          contentType="list"
          contentId={list.id}
          onReported={() => {
            void queryClient.invalidateQueries({ queryKey: ["home"] });
            void queryClient.invalidateQueries({ queryKey: ["home-lists"] });
            void queryClient.invalidateQueries({ queryKey: ["search"] });
          }}
        />
      ) : null}

      <ListDetailModal
        visible={isDetailOpen}
        listId={list.id}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}
