import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatLocationLabel } from "@/components/ui/LocationInputModal";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import {
  useUserCoordinates,
  type UserCoordinates,
} from "@/hooks/useUserCoordinates";
import type { Location as GeoLocation } from "@/http/list-api/types";

export type SelectableCoordinates = Pick<
  UserCoordinates,
  "latitude" | "longitude" | "city" | "region"
>;

interface UseSelectableLocationResult {
  cityLabel: string;
  isLoading: boolean;
  coordinates: SelectableCoordinates | null;
  cityForQuery: string | undefined;
  onLocationSelected: (location: GeoLocation) => void;
}

export function useSelectableLocation(): UseSelectableLocationResult {
  const { t } = useTranslation();
  const { cityLabel: detectedCityLabel, isLoading } = useHomeLocationLabel();
  const { coordinates: userCoordinates } = useUserCoordinates();
  const [manualLocation, setManualLocation] = useState<GeoLocation | null>(null);

  const unknownLabel = t("home.unknownLocation");

  const cityLabel = manualLocation
    ? formatLocationLabel(manualLocation)
    : detectedCityLabel;

  const coordinates = useMemo((): SelectableCoordinates | null => {
    if (manualLocation) {
      return {
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
        city: manualLocation.city?.trim() || undefined,
        region: manualLocation.region?.trim() || undefined,
      };
    }
    if (!userCoordinates) return null;
    return {
      latitude: userCoordinates.latitude,
      longitude: userCoordinates.longitude,
      city: userCoordinates.city,
      region: userCoordinates.region,
    };
  }, [manualLocation, userCoordinates]);

  const cityForQuery = useMemo(() => {
    const pickedCity = manualLocation?.city?.trim();
    if (pickedCity) return pickedCity;

    const detected = detectedCityLabel.trim();
    if (!detected || detected === unknownLabel) return undefined;
    return detected;
  }, [manualLocation, detectedCityLabel, unknownLabel]);

  return {
    cityLabel,
    isLoading: manualLocation ? false : isLoading,
    coordinates,
    cityForQuery,
    onLocationSelected: setManualLocation,
  };
}
