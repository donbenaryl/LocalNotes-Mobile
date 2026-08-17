import { useCallback } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { OfferCard } from "@/components/ui/OfferCard";
import { OffersTabSkeleton } from "@/components/PageComponents/Home/Offers/OffersTabSkeleton";
import { useBusinessOffers } from "@/hooks/useBusinessOffers";
import { useRegisterProfilePullToRefresh } from "./ProfilePullToRefreshContext";

interface ProfileOffersTabProps {
  businessId: string;
}

export function ProfileOffersTab({ businessId }: ProfileOffersTabProps) {
  const { t } = useTranslation();
  const { offers, isLoading, isRefetching, error, refetch } =
    useBusinessOffers(businessId);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  useRegisterProfilePullToRefresh("offers", handleRefresh, isRefetching);

  if (isLoading) {
    return (
      <View className="px-4">
        <OffersTabSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center px-6 py-20">
        <Text className="mb-4 text-center font-geist text-base text-gray-600 dark:text-gray-400">
          {t("offers.error")}
        </Text>
        <LocalNotesButton
          label={t("offers.retry")}
          onPress={() => void refetch()}
          variant="dark"
          isRounded
        />
      </View>
    );
  }

  if (offers.length === 0) {
    return (
      <View className="px-4">
        <EmptyScreen
          title={t("offers.empty")}
          description={t("offers.emptyDescription")}
        />
      </View>
    );
  }

  return (
    <View className="gap-4 px-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </View>
  );
}
