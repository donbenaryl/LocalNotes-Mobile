import { useMemo } from "react";
import { useSearchStore } from "@/stores/useSearchStore";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";

export interface EffectiveSearchCoordinates {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
}

/**
 * Resolves the search location filter (manual city pick, device/profile GPS, or "all")
 * into the coordinates the per-tab search hooks send to their endpoint.
 */
export function useEffectiveSearchLocation(): EffectiveSearchCoordinates | null {
  const locationMode = useSearchStore((s) => s.locationMode);
  const manualLocation = useSearchStore((s) => s.manualLocation);
  const { coordinates: userCoordinates } = useUserCoordinates();

  return useMemo((): EffectiveSearchCoordinates | null => {
    if (locationMode === "all") {
      return null;
    }

    if (locationMode === "city" && manualLocation) {
      return {
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
        city: manualLocation.city || undefined,
        region: manualLocation.region || undefined,
      };
    }

    // "auto" — prefer device/profile GPS when available
    if (userCoordinates) {
      return {
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
        ...(userCoordinates.source === "profile"
          ? {
              city: userCoordinates.city,
              region: userCoordinates.region,
            }
          : {}),
      };
    }

    return null;
  }, [locationMode, manualLocation, userCoordinates]);
}
