import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MessageSquareQuote } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import {
  useProfileReviews,
  useReviewConnections,
  useReviewSummary,
  useSyncReviews,
} from "@/hooks/useProfileReviews";
import type { ReviewProviderId } from "@/http/reviews-api/types";
import { ProfileReviewCard } from "./ProfileReviewCard";
import {
  ReviewSourceChips,
  type ReviewSourceFilter,
} from "./ReviewSourceChips";
import { useRegisterProfilePullToRefresh } from "./ProfilePullToRefreshContext";
import { ProfilePicksTabSkeleton } from "./ProfilePicksTabSkeleton";

const CONNECTED_ACCOUNTS_HREF =
  "/(app)/(stack)/profile/account-settings/connected-accounts" as const;

interface ProfileReviewsTabProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function ProfileReviewsTab({
  userId,
  isOwnProfile = true,
}: ProfileReviewsTabProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [sourceFilter, setSourceFilter] = useState<ReviewSourceFilter>("all");
  const syncMutation = useSyncReviews();

  const {
    data: connections = [],
    isPending: connectionsPending,
    refetch: refetchConnections,
  } = useReviewConnections(isOwnProfile);

  const googleConnected = connections.some(
    (c) => c.provider === "google" && c.connected,
  );
  const anyConnected = connections.some((c) => c.connected);
  const googleConnection = connections.find((c) => c.provider === "google");

  const {
    data: summary,
    isPending: summaryPending,
    refetch: refetchSummary,
  } = useReviewSummary(userId, Boolean(userId));

  const {
    data: reviews = [],
    isPending: reviewsPending,
    isRefetching,
    refetch: refetchReviews,
  } = useProfileReviews(
    userId,
    sourceFilter === "all" ? "all" : (sourceFilter as ReviewProviderId),
    Boolean(userId) && (isOwnProfile ? anyConnected || (summary?.total ?? 0) > 0 : true),
  );

  const chipCounts = useMemo(() => {
    const by = summary?.by_provider ?? {
      google: 0,
      yelp: 0,
      amazon: 0,
      tripadvisor: 0,
    };
    return {
      all: summary?.total ?? 0,
      google: by.google ?? 0,
      yelp: by.yelp ?? 0,
      amazon: by.amazon ?? 0,
      tripadvisor: by.tripadvisor ?? 0,
    };
  }, [summary]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchReviews(),
      refetchSummary(),
      isOwnProfile ? refetchConnections() : Promise.resolve(),
    ]);

    if (!isOwnProfile || !googleConnected || !googleConnection?.last_synced_at) {
      return;
    }
    const last = new Date(googleConnection.last_synced_at).getTime();
    const ageMs = Date.now() - last;
    if (ageMs > 24 * 60 * 60 * 1000 && !syncMutation.isPending) {
      try {
        await syncMutation.mutateAsync();
      } catch {
        // 429 / network — list refetch already happened.
      }
    }
  }, [
    googleConnected,
    googleConnection?.last_synced_at,
    isOwnProfile,
    refetchConnections,
    refetchReviews,
    refetchSummary,
    syncMutation,
  ]);

  useRegisterProfilePullToRefresh("reviews", handleRefresh, isRefetching);

  const openConnectedAccounts = useCallback(() => {
    router.push(CONNECTED_ACCOUNTS_HREF);
  }, [router]);

  if (isOwnProfile && connectionsPending) {
    return (
      <View className="p-4">
        <ProfilePicksTabSkeleton />
      </View>
    );
  }

  // Own profile, nothing connected → empty CTA to settings.
  if (isOwnProfile && !anyConnected) {
    return (
      <View className="items-center px-7 py-10">
        <View className="mb-4 h-[120px] w-[120px] items-center justify-center rounded-[30px] bg-[#FFF1E8] dark:bg-brand/15">
          <MessageSquareQuote size={48} color="#FF6B1A" />
        </View>
        <Text className="mb-2 text-center font-geist-bold text-[21px] leading-[1.2] text-ink dark:text-gray-100">
          {t("profile.reviews.emptyTitle")}
        </Text>
        <Text className="mb-5 max-w-[300px] text-center font-geist text-[13.5px] leading-[1.5] text-gray-600 dark:text-gray-400">
          {t("profile.reviews.emptyDescription")}
        </Text>
        <View className="w-full flex-row justify-center">
          <LocalNotesButton
            label={t("profile.reviews.connectCta")}
            onPress={openConnectedAccounts}
            variant="dark"
            size="md"
            isWidthFull={false}
            className="px-6"
          />
        </View>
      </View>
    );
  }

  const showLoading =
    (summaryPending || reviewsPending) && reviews.length === 0;

  return (
    <View>
      <ReviewSourceChips
        active={sourceFilter}
        counts={chipCounts}
        onChange={setSourceFilter}
        showManage={isOwnProfile}
        onManagePress={openConnectedAccounts}
      />

      {googleConnection?.sync_status === "syncing" ? (
        <View className="mb-2 flex-row items-center justify-center gap-2 px-4">
          <ActivityIndicator size="small" color="#FF6B1A" />
          <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
            {t("profile.reviews.syncing")}
          </Text>
        </View>
      ) : null}

      {showLoading ? (
        <View className="p-4">
          <ProfilePicksTabSkeleton />
        </View>
      ) : reviews.length === 0 ? (
        <View className="px-4">
          <EmptyScreen
            title={t("profile.reviews.noReviewsTitle")}
            description={
              isOwnProfile
                ? t("profile.reviews.noReviewsOwnDescription")
                : t("profile.reviews.noReviewsOtherDescription")
            }
            icon={<MessageSquareQuote size={40} color="#D1D5DB" />}
          />
        </View>
      ) : (
        reviews.map((review) => (
          <ProfileReviewCard key={review.id} review={review} />
        ))
      )}
    </View>
  );
}
