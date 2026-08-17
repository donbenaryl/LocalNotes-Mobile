import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { CardHero } from "@/components/ui/CardHero";
import { toast } from "@/components/ui/Toast";
import { useBusinessFollow } from "@/hooks/useBusinessFollow";
import type { OfferCardItem } from "@/types/offer";
import { isOthersCategoryName } from "@/utils/listCategories";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getTimeLeftLabel } from "@/utils/time";
import { WhiteBox } from "./WhiteBox";

interface OfferCardProps {
  offer: OfferCardItem;
  badge?: ReactNode;
  onPress?: () => void;
}

interface BusinessFollowButtonProps {
  businessId?: string;
  initialIsFollowed: boolean;
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

function BusinessFollowButton({
  businessId,
  initialIsFollowed,
}: BusinessFollowButtonProps) {
  const { t } = useTranslation();
  const { isFollowed, isToggling, toggle } = useBusinessFollow(
    businessId,
    initialIsFollowed,
  );

  if (!businessId) return null;

  return (
    <Pressable
      onPress={() => {
        void toggle();
      }}
      disabled={isToggling}
      accessibilityRole="button"
      accessibilityState={{ selected: isFollowed, busy: isToggling }}
      className={`min-h-10 cursor-pointer items-center justify-center rounded-full px-4 ${
        isFollowed
          ? "border border-gray-200 bg-white dark:border-gray-700 dark:bg-ink"
          : "border-[1.5px] border-ink bg-white dark:border-gray-100 dark:bg-ink"
      }`}
    >
      {isToggling ? (
        <ActivityIndicator
          size="small"
          color={isFollowed ? "#6B7280" : "#141413"}
        />
      ) : (
        <Text
          className={`font-geist-bold text-[13px] ${
            isFollowed
              ? "text-gray-500 dark:text-gray-400"
              : "text-ink dark:text-gray-100"
          }`}
        >
          {isFollowed ? t("offers.following") : t("offers.follow")}
        </Text>
      )}
    </Pressable>
  );
}

export function OfferCard({ offer, badge, onPress }: OfferCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();

  const imageSrc = offer.imageUrl ? resolveImageUrl(offer.imageUrl) : null;
  const untilLabel = offer.expiresAt ? getTimeLeftLabel(offer.expiresAt) : "";
  const isLessThanADay = untilLabel.includes("left");
  const branchLabels = offer.businessBranches ?? [];
  const firstBranchLabel = branchLabels[0];
  const moreBranchCount = branchLabels.length - 1;
  const categoriesSubtitle = formatOfferCategoriesSubtitle(
    offer.categories,
    offer.others_name,
  );
  const showExpiryBadge = Boolean(offer.expiresAt && isLessThanADay);
  const locationLabel = firstBranchLabel ?? t("offers.noLocation");

  const iconMuted = colorScheme === "dark" ? "#9CA3AF" : "#57534E";
  const iconDim = colorScheme === "dark" ? "#6B7280" : "#A8A29E";

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    toast.info(t("alerts.comingSoonMessage"), {
      title: t("alerts.comingSoon"),
    });
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="button">
      <WhiteBox className="overflow-hidden p-0">
        {imageSrc ? (
          <CardHero
            imageUrl={imageSrc}
            title={offer.title ?? ""}
            subtitle={categoriesSubtitle}
            aspectClassName="aspect-[16/10.5]"
          />
        ) : null}

        {showExpiryBadge ? (
          <View
            className="absolute left-2 top-2 z-10"
            pointerEvents="none"
          >
            <View className="self-start rounded-full bg-[#de4f2d] px-2.5 py-1">
              <Text className="font-geist-semibold text-[10px] tracking-wide text-white">
                {untilLabel}
              </Text>
            </View>
          </View>
        ) : null}

        <View
          className={
            !imageSrc && showExpiryBadge ? "px-4 pt-10" : "px-4 pt-2.5"
          }
        >
          <View className="mb-2 flex-row items-center gap-2.5">
            <Avatar
              name={offer.businessName}
              src={offer.businessLogoUrl}
              size="sm"
            />
            <View className="min-w-0 flex-1">
              <Text
                className="font-geist-semibold text-[14.5px] text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {offer.businessName}
              </Text>
              <Text
                className="font-geist text-[13px] text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {locationLabel}
                {moreBranchCount > 0
                  ? ` ${t("offers.moreBranches", { count: moreBranchCount })}`
                  : ""}
              </Text>
            </View>

            <BusinessFollowButton
              businessId={offer.businessId}
              initialIsFollowed={offer.isBusinessFollowed ?? false}
            />
          </View>

          {badge ? <View className="mb-3">{badge}</View> : null}

          {!imageSrc && offer.title ? (
            <Text
              className="mb-1 font-geist-extrabold text-[22px] leading-7 text-ink dark:text-gray-100"
              numberOfLines={2}
            >
              {offer.title}
            </Text>
          ) : null}

          {!imageSrc && categoriesSubtitle ? (
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

          <View className="flex-row items-center gap-1.5">
            <Heart size={13} color={iconMuted} />
            <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
              {offer.likes}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Share2 size={13} color={iconMuted} />
            <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
              {offer.shares}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
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

          <View className="flex-1" />

          <Text
            className="max-w-[45%] font-geist-medium text-[12.5px]"
            numberOfLines={1}
            style={{ color: iconDim }}
          >
            {locationLabel}
          </Text>
        </View>
      </WhiteBox>
    </Pressable>
  );
}
