import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { BadgeCheck } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/Toast";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { useBusinessFollow } from "@/hooks/useBusinessFollow";
import { useSpotlightImageFallback } from "@/hooks/useSpotlightImageFallback";
import { useSpotlightImpressionTracking } from "@/hooks/useSpotlightImpressionTracking";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import type { SpotlightBusinessEntityDAO } from "@/http/spotlight-api/type";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { SpotlightFallbackGradient } from "./SpotlightFallbackGradient";
import { FollowButton } from "@/components/ui/FollowButton";

interface SpotlightBusinessCardProps {
  business: SpotlightBusinessEntityDAO;
}

// Matches spotlight-v4's `.bizcard .bimg` background exactly.
const FALLBACK_GRADIENT_COLORS = ["#2E4A3A", "#5C8A6E"] as const;

export function SpotlightBusinessCard({
  business,
}: SpotlightBusinessCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveImageUrl(business.image);
  const { showFallback, onError } = useSpotlightImageFallback(imageUrl);
  const { isFollowed, isToggling, toggle } = useBusinessFollow(
    business.id,
    false,
  );
  const impressionRef = useSpotlightImpressionTracking(
    business.spotlight_item_id,
  );

  // No business detail route exists anywhere in the app yet — `BusinessCard.tsx`
  // itself falls back to this same "coming soon" toast when tapped without an
  // `onPress` override, so this mirrors that existing precedent rather than
  // inventing a Spotlight-specific destination.
  const handleOpen = () => {
    if (business.spotlight_item_id) {
      void spotlightService.logOpenEvent(business.spotlight_item_id);
    }
    toast.info(t("alerts.comingSoonMessage"), {
      title: t("alerts.comingSoon"),
    });
  };

  return (
    <View ref={impressionRef} role="listitem" className="w-[152px]">
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        className="cursor-pointer"
      >
        <WhiteBox className="overflow-hidden p-0">
          <View className="h-[86px] w-full">
            {showFallback ? (
              <SpotlightFallbackGradient colors={FALLBACK_GRADIENT_COLORS} />
            ) : (
              <Image
                source={{ uri: imageUrl as string }}
                className="h-full w-full"
                resizeMode="cover"
                onError={onError}
              />
            )}
          </View>

          <View className="px-2.5 pb-2.5 pt-2">
            <View className="flex-row items-center gap-1">
              <Text
                className="shrink font-geist-semibold text-lg text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {business.name}
              </Text>
              {business.is_verified ? (
                <View role="img" aria-label={t("spotlight.verified")}>
                  <BadgeCheck size={13} color="#FF6B1A" />
                </View>
              ) : null}
            </View>

            {/*
              Mockup shows "category · neighborhood" — SpotlightBusinessEntityDAO
              (spotlight/public.py::serialize_entity's Business branch) exposes
              only category (business_type), no location/neighborhood field at
              all, so only category renders. Mockup's "In N curators' lists" line
              is omitted for the same reason: no list-count field exists on this
              DAO (unlike SpotlightPickEntityDAO.featured_in_lists_count or
              SpotlightCuratorEntityDAO.list_count) — same "omit, don't fabricate"
              precedent as the reason chip (§3.6), persona label (§3.7), and
              collection subtitle (§3.8) gaps.
            */}
            {business.category ? (
              <Text
                className="mt-0.5 font-geist text-sm text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {business.category}
              </Text>
            ) : null}

            <View className="mt-2.5">
              <FollowButton
                userId={business.id}
                initialIsFollowed={isFollowed}
                loading={isToggling}
                onToggle={toggle}
                useButton
                buttonSize="sm"
                isButtonFull={true}
                variant="default"
              />
            </View>
          </View>
        </WhiteBox>
      </Pressable>
    </View>
  );
}
