import type { ReactNode } from "react";
import {
  RefreshControl,
  Text,
  View,
} from "react-native";
import { HomeChromeScrollView } from "@/components/ui/HomeChromeScrollView";
import { Clock, MapPin, Star, Tag } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { OfferCard } from "@/components/ui/OfferCard";
import { useOffersFeed } from "@/hooks/useOffersFeed";
import type { OfferCardItem } from "@/types/offer";
import { OffersTabSkeleton } from "./OffersTabSkeleton";

interface OffersSectionProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  offers: OfferCardItem[];
  badge?: ReactNode;
}

function OffersSection({
  icon,
  title,
  subtitle,
  offers,
  badge,
}: OffersSectionProps) {
  if (offers.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {icon}
          <View className="min-w-0 flex-1">
            <Text className="font-geist-bold text-base text-ink dark:text-gray-100">
              {title}
            </Text>
            <Text className="font-geist text-xs text-gray-400 dark:text-gray-500">
              {subtitle}
            </Text>
          </View>
        </View>
        <View className="ml-2 shrink-0 rounded-md bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
          <Text className="font-geist-medium text-sm text-gray-600 dark:text-gray-400">
            {offers.length}
          </Text>
        </View>
      </View>

      <View className="gap-4">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} badge={badge} />
        ))}
      </View>
    </View>
  );
}

export function OffersTab() {
  const { t } = useTranslation();
  const { sections, totalCount, isLoading, error, refetch } = useOffersFeed();

  if (isLoading) {
    return <OffersTabSkeleton />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
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

  const followedBadge = (
    <Badge
      label={t("offers.followedBadge")}
      variant="primary"
      leftIcon={<Star size={12} color="#FF6B1A" />}
    />
  );

  const nearYouBadge = (
    <Badge
      label={t("offers.nearYouBadge")}
      variant="secondary"
      leftIcon={<MapPin size={12} color="#3B82F6" />}
    />
  );

  return (
    <HomeChromeScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8 pt-4"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => void refetch()}
          tintColor="#FF6B1A"
        />
      }
    >
      <View className="mb-16">
        <View className="mb-6">
          <Text className="font-geist-bold text-lg text-ink dark:text-gray-100">
            {t("offers.title")} ({totalCount})
          </Text>
          <Text className="mt-1 font-geist text-sm text-gray-500 dark:text-gray-400">
            {t("offers.description")}
          </Text>
        </View>

        {totalCount === 0 ? (
          <EmptyScreen
            title={t("offers.empty")}
            description={t("offers.emptyDescription")}
            className="justify-center py-20"
          />
        ) : (
          <>
            <OffersSection
              icon={<Clock size={20} color="#FF6B1A" />}
              title={t("offers.sections.expiringSoon.title")}
              subtitle={t("offers.sections.expiringSoon.subtitle")}
              offers={sections.expiringSoon}
            />
            <OffersSection
              icon={<Star size={20} color="#FB923C" />}
              title={t("offers.sections.followed.title")}
              subtitle={t("offers.sections.followed.subtitle")}
              offers={sections.followed}
              badge={followedBadge}
            />
            <OffersSection
              icon={<MapPin size={20} color="#3B82F6" />}
              title={t("offers.sections.nearYou.title")}
              subtitle={t("offers.sections.nearYou.subtitle")}
              offers={sections.nearYou}
              badge={nearYouBadge}
            />
            <OffersSection
              icon={<Tag size={20} color="#9CA3AF" />}
              title={t("offers.sections.moreOffers.title")}
              subtitle={t("offers.sections.moreOffers.subtitle")}
              offers={sections.other}
            />
          </>
        )}
      </View>
    </HomeChromeScrollView>
  );
}
