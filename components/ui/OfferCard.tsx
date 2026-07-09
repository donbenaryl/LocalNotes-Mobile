import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  ImageOff,
  MapPin,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toast";
import businessService from "@/http/business-api/business.service";
import type { OfferCardItem } from "@/types/offer";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getTimeLeftLabel } from "@/utils/time";
import { WhiteBox } from "./WhiteBox";
import { NoImage } from "./NoImage";

interface OfferCardProps {
  offer: OfferCardItem;
  badge?: ReactNode;
  onPress?: () => void;
}

interface BusinessFollowButtonProps {
  businessId?: string;
  initialIsFollowed: boolean;
}

function BusinessFollowButton({
  businessId,
  initialIsFollowed,
}: BusinessFollowButtonProps) {
  const { t } = useTranslation();
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFollowed(initialIsFollowed);
  }, [initialIsFollowed]);

  const handlePress = async () => {
    if (!businessId || loading) return;

    setLoading(true);
    try {
      if (isFollowed) {
        await businessService.unfollowBusiness(businessId);
        setIsFollowed(false);
      } else {
        await businessService.followBusiness(businessId);
        setIsFollowed(true);
      }
    } catch (error) {
      console.error(
        `Failed to toggle follow for business ${businessId}:`,
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!businessId) return null;

  return (
    <Pressable
      onPress={() => {
        void handlePress();
      }}
      disabled={loading}
      accessibilityRole="button"
      className="cursor-pointer rounded-full border border-gray-200 px-2.5 py-1 dark:border-gray-700"
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FF6B1A" />
      ) : (
        <Text className="font-geist-medium text-xs text-ink dark:text-gray-100">
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
      <WhiteBox className="p-0">
        {/* Hero image */}
        {imageSrc && (
          <View className="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              source={{ uri: imageSrc }}
              className="h-full w-full"
              resizeMode="cover"
            />

            {offer.expiresAt && isLessThanADay ? (
              <View className="absolute left-3 top-3 rounded-full bg-[#de4f2d] px-2.5 py-1">
                <Text className="font-geist-semibold text-[10px] tracking-wide text-white">
                  {untilLabel}
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
                name={offer.businessName}
                src={offer.businessLogoUrl}
                size="sm"
              />
              <View className="min-w-0 flex-1">
                <Text
                  className="font-geist-semibold text-sm text-ink dark:text-gray-100"
                  numberOfLines={1}
                >
                  {offer.businessName}
                </Text>
                <Text
                  className="font-geist text-xs text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                >
                  {firstBranchLabel ?? t("offers.noLocation")}
                  {moreBranchCount > 0
                    ? ` ${t("offers.moreBranches", { count: moreBranchCount })}`
                    : ""}
                </Text>
              </View>
            </View>

            <View className="ml-2">
              <BusinessFollowButton
                businessId={offer.businessId}
                initialIsFollowed={offer.isBusinessFollowed ?? false}
              />
            </View>
          </View>

          {badge ? <View className="mb-3">{badge}</View> : null}

          {/* Title + description */}
          {offer.title ? (
            <Text
              className="mb-1 font-geist-bold text-lg text-ink dark:text-gray-100"
              numberOfLines={2}
            >
              {offer.title}
            </Text>
          ) : null}

          <Text
            className="mb-3 font-geist text-sm leading-5 text-gray-500 dark:text-gray-400"
            numberOfLines={3}
          >
            {offer.content ?? t("offers.noDetails")}
          </Text>

          {/* Category chips */}
          {offer.categories?.length ? (
            <View className="mb-3 flex-row flex-wrap items-center gap-2">
              {offer.categories.map((category) => (
                <View
                  key={category}
                  className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800"
                >
                  <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                    {category.toLowerCase() === "others"
                      ? (offer.others_name ?? category)
                      : category}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Footer stats */}
        <View className="flex-row bg-page overflow-hidden py-2 border-t border-gray-100 dark:border-gray-800 px-4">
          <View className="flex-1 flex-row items-center justify-center gap-1 px-2 py-3">
            <MapPin size={12} color="#EF4444" />
            <Text
              className="text-center font-geist text-xs text-gray-600 dark:text-gray-400"
              numberOfLines={1}
            >
              {firstBranchLabel ?? t("offers.noLocation")}
            </Text>
          </View>

          <View className="flex-1 flex-row items-center justify-center gap-1 px-2 py-3">
            {isLessThanADay ? (
              <Clock size={12} color="#de4f2d" />
            ) : (
              <Calendar size={12} color="#6B7280" />
            )}
            <Text
              className={`text-center font-geist text-xs ${
                isLessThanADay
                  ? "text-[#de4f2d]"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              numberOfLines={1}
            >
              {untilLabel || t("offers.noExpiration")}
            </Text>
          </View>

          <View className="flex-1 flex-row items-center justify-center gap-1 px-2 py-3">
            <Eye size={12} color="#6B7280" />
            <Text
              className="text-center font-geist text-xs text-gray-600 dark:text-gray-400"
              numberOfLines={1}
            >
              {offer.views}
            </Text>
          </View>

          <View className="flex-1 flex-row items-center justify-center gap-1 px-2 py-3">
            <Heart size={12} color="#15803D" />
            <Text
              className="text-center font-geist text-xs text-success"
              numberOfLines={1}
            >
              {offer.likes}
            </Text>
          </View>
        </View>
      </WhiteBox>
    </Pressable>
  );
}
