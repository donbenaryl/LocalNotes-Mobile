import { useEffect } from "react";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { useSearchStore } from "@/stores/useSearchStore";

/**
 * One-time search location default: home address (profile coords) → device GPS → "all".
 * Skips after the first resolve so manual city/"All" picks are preserved across remounts.
 */
export function useInitializeSearchLocation(): { isInitializing: boolean } {
  const { coordinates, isLoading } = useUserCoordinates();
  const hasAppliedDefaultLocation = useSearchStore(
    (s) => s.hasAppliedDefaultLocation,
  );
  const setLocationMode = useSearchStore((s) => s.setLocationMode);
  const setHasAppliedDefaultLocation = useSearchStore(
    (s) => s.setHasAppliedDefaultLocation,
  );

  useEffect(() => {
    if (hasAppliedDefaultLocation || isLoading) return;

    setLocationMode(coordinates ? "auto" : "all");
    setHasAppliedDefaultLocation(true);
  }, [
    hasAppliedDefaultLocation,
    isLoading,
    coordinates,
    setLocationMode,
    setHasAppliedDefaultLocation,
  ]);

  return {
    isInitializing: !hasAppliedDefaultLocation && isLoading,
  };
}
