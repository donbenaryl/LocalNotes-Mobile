import { useCallback, type ReactNode } from "react";
import { Text, View } from "react-native";
import { useRegisterSectionPullToRefresh } from "@/components/ui/SectionPullToRefreshContext";
import { Clock, MapPin, Star, Tag } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { LocationPickerChip } from "@/components/ui/LocationInputModal";
import { OfferCard } from "@/components/ui/OfferCard";
import { useOffersFeed } from "@/hooks/useOffersFeed";
import { useSelectableLocation } from "@/hooks/useSelectableLocation";
import type { Location as GeoLocation } from "@/http/list-api/types";
import type { OfferCardItem } from "@/types/offer";
import { OffersTabSkeleton } from "./OffersTabSkeleton";

interface OffersSectionProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  offers: OfferCardItem[];
  badge?: ReactNode;
}

function OffersLocationBar({
  cityLabel,
  isLoading,
  onLocationSelected,
}: {
  cityLabel: string;
  isLoading: boolean;
  onLocationSelected: (location: GeoLocation) => void;
}) {
  return (
    <View className="mb-1 flex-row items-center justify-end px-4">
      <LocationPickerChip
        cityLabel={cityLabel}
        isLoading={isLoading}
        onLocationSelected={onLocationSelected}
      />
    </View>
  );
}

function OffersShell({
  cityLabel,
  isLocationLoading,
  onLocationSelected,
  children,
}: {
  cityLabel: string;
  isLocationLoading: boolean;
  onLocationSelected: (location: GeoLocation) => void;
  children: ReactNode;
}) {
  return (
    <View>
      <OffersLocationBar
        cityLabel={cityLabel}
        isLoading={isLocationLoading}
        onLocationSelected={onLocationSelected}
      />
      {children}
    </View>
  );
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
  const {
    cityLabel,
    isLoading: isLocationLoading,
    coordinates,
    onLocationSelected,
  } = useSelectableLocation();
  const { sections, totalCount, isLoading, isRefetching, error, refetch } =
    useOffersFeed(coordinates, !isLocationLoading);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  useRegisterSectionPullToRefresh("offers", handleRefresh, isRefetching);

  const shellProps = {
    cityLabel,
    isLocationLoading,
    onLocationSelected,
  };

  if (isLoading || isLocationLoading) {
    return (
      <OffersShell {...shellProps}>
        <OffersTabSkeleton />
      </OffersShell>
    );
  }

  if (error) {
    return (
      <OffersShell {...shellProps}>
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
      </OffersShell>
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
    <OffersShell {...shellProps}>
      <View className="px-4">
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
    </OffersShell>
  );
}
