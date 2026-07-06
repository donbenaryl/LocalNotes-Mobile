import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import accountService from "@/http/account-api/account.services";

export type CoordinateSource = "profile" | "device" | null;

interface UserCoordinates {
  latitude: number;
  longitude: number;
  source: CoordinateSource;
}

interface UseUserCoordinatesResult {
  coordinates: UserCoordinates | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserCoordinates(): UseUserCoordinatesResult {
  const [deviceCoords, setDeviceCoords] = useState<UserCoordinates | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await accountService.fetchUser();
      return response.data?.data ?? null;
    },
  });

  const profileLat = profile?.location?.latitude;
  const profileLng = profile?.location?.longitude;
  const hasProfileCoords =
    profileLat !== undefined &&
    profileLng !== undefined &&
    profileLat !== null &&
    profileLng !== null;

  useEffect(() => {
    if (profileLoading || hasProfileCoords) return;

    let cancelled = false;

    async function fetchDeviceLocation() {
      setDeviceLoading(true);
      setDeviceError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) {
            setDeviceError("Location permission denied");
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setDeviceCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: "device",
          });
        }
      } catch {
        if (!cancelled) {
          setDeviceError("Unable to get current location");
        }
      } finally {
        if (!cancelled) {
          setDeviceLoading(false);
        }
      }
    }

    void fetchDeviceLocation();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, hasProfileCoords]);

  if (hasProfileCoords) {
    return {
      coordinates: {
        latitude: profileLat,
        longitude: profileLng,
        source: "profile",
      },
      isLoading: profileLoading,
      error: profileError ? "Failed to load profile location" : null,
    };
  }

  return {
    coordinates: deviceCoords,
    isLoading: profileLoading || deviceLoading,
    error: deviceError,
  };
}
