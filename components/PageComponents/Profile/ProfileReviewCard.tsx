import { Linking, Pressable, Text, View } from "react-native";
import { Star } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { formatRelativeTime } from "@/utils/time";
import { cn } from "@/utils/cn";
import type { ImportedReviewDAO } from "@/http/reviews-api/types";
import { REVIEW_PROVIDER_BADGE } from "./ReviewSourceChips";

interface ProfileReviewCardProps {
  review: ImportedReviewDAO;
}

function StarRow({ rating }: { rating: number | null | undefined }) {
  const value = rating ?? 0;
  return (
    <View className="mb-1.5 flex-row items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(value);
        return (
          <Star
            key={index}
            size={13}
            color={filled ? "#FFB800" : "#E7E5E0"}
            fill={filled ? "#FFB800" : "transparent"}
          />
        );
      })}
      {rating != null ? (
        <Text className="ml-1 font-geist-medium text-[11px] text-gray-500 dark:text-gray-400">
          {Number(rating).toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}

export function ProfileReviewCard({ review }: ProfileReviewCardProps) {
  const { t } = useTranslation();
  const badge = REVIEW_PROVIDER_BADGE[review.provider];
  const when = review.published_at
    ? formatRelativeTime(review.published_at)
    : formatRelativeTime(review.created_at);
  const placeMeta = [review.place_category, review.place_address]
    .filter(Boolean)
    .join(" · ");
  const editUrl = review.source_url || review.google_maps_url;

  return (
    <WhiteBox className="mx-3.5 mb-2.5 p-3.5">
      <View className="mb-2.5 flex-row items-center gap-2.5">
        <Avatar
          size="sm"
          src={review.author_profile_image_url ?? undefined}
          name={review.author_name}
        />
        <View className="min-w-0 flex-1">
          <Text className="font-geist-bold text-[13px] text-ink dark:text-gray-100">
            {review.author_name}
            {review.author_personality_name ? (
              <Text className="font-geist-medium text-[11px] text-[#BA7517]">
                {" "}
                {review.author_personality_name}
              </Text>
            ) : null}
          </Text>
          <View className="mt-0.5 flex-row flex-wrap items-center gap-1.5">
            <Text className="font-geist text-[11px] text-gray-500 dark:text-gray-400">
              {when}
            </Text>
            <View className="flex-row items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 dark:bg-gray-800">
              <View
                className={cn(
                  "h-3.5 w-3.5 items-center justify-center rounded",
                  badge.badgeClass,
                )}
              >
                <Text
                  className={cn(
                    "font-geist-extrabold text-[8px]",
                    badge.letterClass,
                  )}
                >
                  {badge.letter}
                </Text>
              </View>
              <Text className="font-geist-semibold text-[10px] text-gray-600 dark:text-gray-300">
                {badge.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <StarRow rating={review.rating} />

      {review.place_name ? (
        <Text className="mb-1 font-geist-bold text-[13.5px] leading-[1.3] text-ink dark:text-gray-100">
          {review.place_name}
        </Text>
      ) : null}
      {placeMeta ? (
        <Text className="mb-2 font-geist text-[11px] text-gray-500 dark:text-gray-400">
          {placeMeta}
        </Text>
      ) : null}

      {review.body ? (
        <Text className="mb-2.5 font-geist text-[13px] leading-[1.55] text-ink dark:text-gray-100">
          {review.body}
        </Text>
      ) : null}

      <View className="flex-row items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-800">
        {review.helpful_count != null && review.helpful_count > 0 ? (
          <Text className="font-geist text-[11px] text-gray-500 dark:text-gray-400">
            {t("profile.reviews.helpfulCount", { count: review.helpful_count })}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        {editUrl ? (
          <Pressable
            onPress={() => {
              void Linking.openURL(editUrl);
            }}
            hitSlop={8}
            className="ml-auto"
          >
            <Text className="font-geist-semibold text-[11px] text-gray-600 underline dark:text-gray-300">
              {t("profile.reviews.editOn", { provider: badge.label })}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </WhiteBox>
  );
}
