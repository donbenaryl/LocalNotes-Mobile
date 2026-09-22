import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { CardHero } from "@/components/ui/CardHero";
import { ListAuthorRow } from "@/components/ui/ListAuthorRow";
import { toast } from "@/components/ui/Toast";
import { useBusinessFollow } from "@/hooks/useBusinessFollow";
import notesService from "@/http/notes-api/notes.service";
import type { NoteDAO } from "@/http/notes-api/types";
import { useBusinessStore } from "@/stores/useBusinessStore";
import type { OfferCardItem } from "@/types/offer";
import { cn } from "@/utils/cn";
import { isOthersCategoryName } from "@/utils/listCategories";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { withViewOrigin } from "@/utils/viewTracking";
import { getTimeLeftLabel } from "@/utils/time";
import { WhiteBox } from "./WhiteBox";

interface OfferCardProps {
  offer: OfferCardItem;
  badge?: ReactNode;
  onPress?: () => void;
}

function formatOfferCategoriesSubtitle(
  categories: string[] | undefined,
  othersName?: string,
): string | undefined {
  if (!categories?.length) return undefined;
  return categories
    .map((category) =>
      isOthersCategoryName(category) ? (othersName ?? category) : category,
    )
    .join(" · ");
}

function patchOfferListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  offerId: string,
  patch: Pick<OfferCardItem, "isLiked" | "likes">,
) {
  const patchList = (previous: OfferCardItem[] | undefined) => {
    if (!previous) return previous;
    return previous.map((item) =>
      item.id === offerId
        ? { ...item, isLiked: patch.isLiked, likes: patch.likes }
        : item,
    );
  };

  queryClient.setQueriesData<OfferCardItem[]>(
    { queryKey: ["offers-feed"] },
    patchList,
  );
  queryClient.setQueriesData<OfferCardItem[]>(
    { queryKey: ["business-offers"] },
    patchList,
  );
}

export function OfferCard({ offer, badge, onPress }: OfferCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const ownedBusinessId = useBusinessStore((s) => s.businessId);
  const ownedBusinesses = useBusinessStore((s) => s.ownedBusinesses);

  const imageSrc = offer.imageUrl ? resolveImageUrl(offer.imageUrl) : null;
  const videoSrc = offer.videoUrl ? resolveImageUrl(offer.videoUrl) : null;
  const hasHero = Boolean(imageSrc || videoSrc);
  const untilLabel = offer.expiresAt ? getTimeLeftLabel(offer.expiresAt) : "";
  const isLessThanADay = untilLabel.includes("left");
  const branchLabels = offer.businessBranches ?? [];
  const firstBranchLabel = branchLabels[0];
  const moreBranchCount = branchLabels.length - 1;
  const categoriesSubtitle = formatOfferCategoriesSubtitle(
    offer.categories,
    offer.others_name,
  );
  const showLocationPill = Boolean(firstBranchLabel);
  const locationLabel = firstBranchLabel ?? t("offers.noLocation");
  const businessSubtitle =
    moreBranchCount > 0
      ? `${locationLabel} ${t("offers.moreBranches", { count: moreBranchCount })}`
      : locationLabel;

  const isOwnBusiness =
    Boolean(offer.businessId) &&
    (ownedBusinessId === offer.businessId ||
      ownedBusinesses.some((b) => b.id === offer.businessId));

  const { isFollowed, isToggling, toggle } = useBusinessFollow(
    offer.businessId,
    offer.isBusinessFollowed ?? false,
  );

  const [isLiked, setIsLiked] = useState(offer.isLiked ?? false);
  const [likes, setLikes] = useState(offer.likes);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setIsLiked(offer.isLiked ?? false);
    setLikes(offer.likes);
  }, [offer.id, offer.isLiked, offer.likes]);

  const iconMuted = colorScheme === "dark" ? "#9CA3AF" : "#57534E";

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    toast.info(t("alerts.comingSoonMessage"), {
      title: t("alerts.comingSoon"),
    });
  };

  const handleBusinessPress = useCallback(() => {
    if (!offer.businessId) return;
    router.push(
      withViewOrigin(`/business/${offer.businessId}`, "offer") as never,
    );
  }, [offer.businessId, router]);

  const applyLikePatch = useCallback(
    (nextLiked: boolean, nextLikes: number) => {
      patchOfferListCaches(queryClient, offer.id, {
        isLiked: nextLiked,
        likes: nextLikes,
      });
      queryClient.setQueryData<NoteDAO | null>(
        ["note-detail", offer.id],
        (previous) =>
          previous
            ? {
                ...previous,
                is_liked: nextLiked,
                like_count: nextLikes,
              }
            : previous,
      );
    },
    [offer.id, queryClient],
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
      const response = nextLiked
        ? await notesService.likeNote(offer.id)
        : await notesService.unlikeNote(offer.id);
      if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      console.error("Failed to toggle offer like:", error);
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      applyLikePatch(previousLiked, previousLikes);
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, isLiked, likes, offer.id, applyLikePatch]);

  const handleShare = useCallback(async () => {
    try {
      const message = [offer.title, offer.content].filter(Boolean).join("\n");
      await Share.share({ message, title: offer.title });
    } catch (error) {
      console.error("Failed to share offer:", error);
    }
  }, [offer.title, offer.content]);

  return (
    <Pressable onPress={handlePress} accessibilityRole="button">
      <WhiteBox className="overflow-hidden p-0">
        {hasHero ? (
          <CardHero
            imageUrl={imageSrc ?? undefined}
            videoUrl={videoSrc ?? undefined}
            title={offer.title ?? ""}
            subtitle={categoriesSubtitle}
            aspectClassName="aspect-[16/10.5]"
          />
        ) : null}

        {showLocationPill ? (
          <View
            className="absolute left-2 top-2 z-10 gap-1.5"
            pointerEvents="none"
          >
            <View className="self-start rounded-full bg-black/40 px-2.5 py-1">
              <Text
                className="font-geist-medium text-[12px] text-white"
                numberOfLines={1}
              >
                {firstBranchLabel}
              </Text>
            </View>
          </View>
        ) : null}

        <View
          className={
            !hasHero && showLocationPill ? "pl-4 pt-10" : "pl-4 pt-2.5"
          }
        >
          {offer.businessId ? (
            <ListAuthorRow
              account={{
                id: offer.businessId,
                name: offer.businessName,
                profile_image: offer.businessLogoUrl,
              }}
              subtitle={businessSubtitle}
              isOwnList={isOwnBusiness}
              initialIsFollowed={offer.isBusinessFollowed ?? false}
              isFollowed={isFollowed}
              onFollowToggle={toggle}
              followLoading={isToggling}
              onPress={handleBusinessPress}
              disableAvatarNavigation
            />
          ) : (
            <View className="mb-2 flex-row items-center gap-2.5">
              <Text
                className="font-geist-semibold text-[14.5px] text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {offer.businessName}
              </Text>
            </View>
          )}

          {badge ? <View className="mb-3">{badge}</View> : null}

          {!hasHero && offer.title ? (
            <Text
              className="mb-1 font-geist-extrabold text-[22px] leading-7 text-ink dark:text-gray-100"
              numberOfLines={2}
            >
              {offer.title}
            </Text>
          ) : null}

          {!hasHero && categoriesSubtitle ? (
            <Text
              className="mb-2 font-geist text-[13px] text-gray-500 dark:text-gray-400"
              numberOfLines={2}
            >
              {categoriesSubtitle}
            </Text>
          ) : null}

          <Text className="mb-3 font-geist text-[14.5px] leading-5 text-gray-500 dark:text-gray-400">
            {offer.content ?? t("offers.noDetails")}
          </Text>
        </View>

        <View className="flex-row items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <View className="flex-row items-center gap-1.5">
            <Eye size={13} color={iconMuted} />
            <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
              {offer.views}
            </Text>
          </View>

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
              className={cn(
                "font-geist-semibold text-[12.5px]",
                isLiked
                  ? "text-brand"
                  : "text-gray-500 dark:text-gray-400",
              )}
            >
              {likes}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void handleShare()}
            accessibilityRole="button"
            accessibilityLabel={t("listDetail.share")}
            className="cursor-pointer flex-row items-center gap-1.5"
            hitSlop={4}
          >
            <Share2 size={13} color={iconMuted} />
            <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
              {offer.shares}
            </Text>
          </Pressable>

          <View className="flex-1" />

          <View className="max-w-[45%] flex-row items-center gap-1.5">
            {isLessThanADay ? (
              <Clock size={13} color="#de4f2d" />
            ) : (
              <Calendar size={13} color={iconMuted} />
            )}
            <Text
              className={`font-geist-semibold text-[12.5px] ${
                isLessThanADay
                  ? "text-[#de4f2d]"
                  : "text-gray-500 dark:text-gray-400"
              }`}
              numberOfLines={1}
            >
              {untilLabel || t("offers.noExpiration")}
            </Text>
          </View>
        </View>
      </WhiteBox>
    </Pressable>
  );
}

