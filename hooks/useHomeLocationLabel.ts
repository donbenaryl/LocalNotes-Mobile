import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import accountService from "@/http/account-api/account.services";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";

interface UseHomeLocationLabelResult {
  cityLabel: string;
  isLoading: boolean;
}

export function useHomeLocationLabel(): UseHomeLocationLabelResult {
  const { t } = useTranslation();
  const { coordinates } = useUserCoordinates();
  const [geocodedCity, setGeocodedCity] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await accountService.fetchUser();
      return response.data?.data ?? null;
    },
  });

  const profileCity = profile?.location?.city?.trim() || null;
  const hasProfileCity = Boolean(profileCity);

  useEffect(() => {
    if (profileLoading || hasProfileCity || !coordinates) {
      return;
    }

    const { latitude, longitude } = coordinates;
    let cancelled = false;

    async function reverseGeocode() {
      setIsGeocoding(true);
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        const city = results[0]?.city?.trim() || results[0]?.subregion?.trim() || null;
        if (!cancelled) {
          setGeocodedCity(city);
        }
      } catch {
        if (!cancelled) {
          setGeocodedCity(null);
        }
      } finally {
        if (!cancelled) {
          setIsGeocoding(false);
        }
      }
    }

    void reverseGeocode();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, hasProfileCity, coordinates]);

  if (profileLoading) {
    return { cityLabel: "", isLoading: true };
  }

  if (profileCity) {
    return { cityLabel: profileCity, isLoading: false };
  }

  if (isGeocoding) {
    return { cityLabel: "", isLoading: true };
  }

  if (geocodedCity) {
    return { cityLabel: geocodedCity, isLoading: false };
  }

  return {
    cityLabel: t("home.unknownLocation"),
    isLoading: false,
  };
}
