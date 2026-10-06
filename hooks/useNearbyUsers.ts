import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { useAuthStore } from "@/stores/useAuthStore";

export const NEARBY_USERS_RADIUS_KM = 10;
const NEARBY_USERS_LIMIT = 50;

/** People within {@link NEARBY_USERS_RADIUS_KM} of the user's profile/device location. */
export function useNearbyUsers() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const {
    coordinates,
    isLoading: locationLoading,
    error: locationError,
  } = useUserCoordinates();

  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;

  const query = useQuery({
    queryKey: ["nearbyUsers", latitude ?? null, longitude ?? null],
    enabled: latitude !== undefined && longitude !== undefined,
    queryFn: async (): Promise<UnifiedSearchPersonDAO[]> => {
      const response = await accountService.searchPeople({
        latitude,
        longitude,
        radiusKm: NEARBY_USERS_RADIUS_KM,
        limit: NEARBY_USERS_LIMIT,
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data ?? [];
    },
  });

  const users = useMemo(
    () => (query.data ?? []).filter((user) => user.id !== currentUserId),
    [query.data, currentUserId],
  );

  return {
    users,
    isLoading: locationLoading || query.isLoading,
    error: query.error,
    locationError,
    refetch: query.refetch,
  };
}
