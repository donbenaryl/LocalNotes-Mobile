import { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { MapPin, Navigation } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import type { BusinessBranchDAO, BusinessLocation } from '@/http/business-api/types';
import { ICON_COLOR_DARK, ICON_COLOR_LIGHT } from '@/constants/colors';
import { formatDistanceMiles, getDistanceInMiles } from '@/utils/geo';
import { openInMaps } from '@/utils/smartPick';
import { WhiteBox } from '@/components/ui/WhiteBox';

const MAP_HEIGHT = 176;
const MAP_DELTA = 0.02;
/** Clip Apple Maps legal label overflow (SearchMap pattern). */
const LEGAL_LABEL_CLIP = 28;

interface UserCoordinates {
  latitude: number;
  longitude: number;
}

interface BranchLocationCardProps {
  branch: BusinessBranchDAO;
  businessName: string;
  logoUri: string | null;
  userCoordinates: UserCoordinates | null;
}

function hasValidCoordinates(
  location?: BusinessLocation | null,
): location is BusinessLocation {
  return (
    location != null &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    !Number.isNaN(location.latitude) &&
    !Number.isNaN(location.longitude) &&
    !(location.latitude === 0 && location.longitude === 0)
  );
}

function formatPrimaryAddress(location: BusinessLocation): string {
  const cityRegion = [location.city, location.region].filter(Boolean).join(', ');
  return [location.street_address, cityRegion, location.postal_code]
    .filter(Boolean)
    .join(', ');
}

function formatSecondaryAddress(branch: BusinessBranchDAO): string | null {
  const cityRegion = [branch.location.city, branch.location.region]
    .filter(Boolean)
    .join(', ');
  const parts = [branch.name, cityRegion].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function BranchMapPin({
  logoUri,
  businessName,
}: {
  logoUri: string | null;
  businessName: string;
}) {
  const initial = businessName.charAt(0).toUpperCase();

  return (
    <View className="items-center">
      <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white bg-brand shadow-md">
        {logoUri ? (
          <Image
            source={{ uri: logoUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="font-geist-bold text-[13px] text-white">{initial}</Text>
        )}
      </View>
      <View className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-white" />
    </View>
  );
}

export function BranchLocationCard({
  branch,
  businessName,
  logoUri,
  userCoordinates,
}: BranchLocationCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? ICON_COLOR_DARK : ICON_COLOR_LIGHT;
  const directionsIconColor = colorScheme === 'dark' ? '#141413' : '#FFFFFF';

  const location = branch.location;
  const hasCoords = hasValidCoordinates(location);
  const primaryAddress = formatPrimaryAddress(location);
  const secondaryAddress = formatSecondaryAddress(branch);

  const mapRegion = useMemo((): Region | null => {
    if (!hasCoords) return null;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: MAP_DELTA,
      longitudeDelta: MAP_DELTA,
    };
  }, [hasCoords, location.latitude, location.longitude]);

  const distanceLabel = useMemo(() => {
    if (!hasCoords || !userCoordinates) return null;
    const miles = getDistanceInMiles(userCoordinates, {
      latitude: location.latitude,
      longitude: location.longitude,
    });
    return formatDistanceMiles(miles);
  }, [hasCoords, location.latitude, location.longitude, userCoordinates]);

  const directionsLabel = distanceLabel
    ? t('profile.about.directionsWithDistance', { distance: distanceLabel })
    : t('profile.picks.directions');

  const handleDirections = () => {
    if (!hasCoords) return;
    openInMaps(location.latitude, location.longitude, businessName);
  };

  return (
    <WhiteBox>
      <Text className="font-geist-bold text-[10.5px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
        {t('profile.about.location')}
      </Text>

      <View
        className="mt-3 overflow-hidden rounded-2xl bg-soft dark:bg-gray-900"
        style={{ height: MAP_HEIGHT }}
      >
        {hasCoords && mapRegion ? (
          <MapView
            style={{ flex: 1, marginBottom: -LEGAL_LABEL_CLIP }}
            initialRegion={mapRegion}
            scrollEnabled
            zoomEnabled
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
            >
              <BranchMapPin logoUri={logoUri} businessName={businessName} />
            </Marker>
          </MapView>
        ) : (
          <View className="h-full items-center justify-center">
            <MapPin size={28} color={iconColor} strokeWidth={1.75} />
          </View>
        )}
      </View>

      <Text
        className="mt-3 font-geist-bold text-[17px] leading-[1.35] text-ink dark:text-gray-100"
        numberOfLines={2}
      >
        {primaryAddress}
      </Text>

      {secondaryAddress ? (
        <Text
          className="mt-1 font-geist text-[14px] leading-[1.4] text-gray-500 dark:text-gray-400"
          numberOfLines={2}
        >
          {secondaryAddress}
        </Text>
      ) : null}

      {hasCoords ? (
        <Pressable
          onPress={handleDirections}
          accessibilityRole="button"
          className="mt-4 min-h-[46px] flex-row items-center justify-center gap-1.5 rounded-full bg-ink active:opacity-80 dark:bg-gray-100"
        >
          <Navigation size={15} color={directionsIconColor} />
          <Text className="font-geist-bold text-sm text-white dark:text-ink">
            {directionsLabel}
          </Text>
        </Pressable>
      ) : null}
    </WhiteBox>
  );
}
