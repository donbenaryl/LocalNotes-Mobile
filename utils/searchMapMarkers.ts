import type { Region } from "react-native-maps";
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { ListItemDAO, Location } from "@/http/list-api/types";

export type SearchMapMarkerKind = "list" | "business";

export interface SearchMapMarker {
  id: string;
  kind: SearchMapMarkerKind;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
}

function hasValidCoordinates(
  location?: Location | null | { latitude?: number; longitude?: number },
): location is { latitude: number; longitude: number } {
  return (
    location != null &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    !Number.isNaN(location.latitude) &&
    !Number.isNaN(location.longitude) &&
    !(location.latitude === 0 && location.longitude === 0)
  );
}

/** List pins sit at the list's geographic center (handoff 05.A.1). */
export function buildListMapMarkers(lists: ListItemDAO[]): SearchMapMarker[] {
  const markers: SearchMapMarker[] = [];

  for (const list of lists) {
    if (!hasValidCoordinates(list.location)) continue;
    markers.push({
      id: `list-${list.id}`,
      kind: "list",
      latitude: list.location.latitude,
      longitude: list.location.longitude,
      title: list.name,
      subtitle: list.location.city,
    });
  }

  return markers;
}

/** Place pins use the first branch with valid coordinates (web MapPanel). */
export function buildBusinessMapMarkers(
  businesses: BusinessItemDAO[],
): SearchMapMarker[] {
  const markers: SearchMapMarker[] = [];

  for (const business of businesses) {
    const branch =
      business.branches?.find((b) => hasValidCoordinates(b.location)) ?? null;
    const fallback = hasValidCoordinates(business.location)
      ? business.location
      : null;
    const location = branch?.location ?? fallback;
    if (!location || !hasValidCoordinates(location)) continue;

    markers.push({
      id: `business-${business.id}`,
      kind: "business",
      latitude: location.latitude,
      longitude: location.longitude,
      title: business.name,
      subtitle: business.business_type,
    });
  }

  return markers;
}

export function getSearchMapRegion(markers: SearchMapMarker[]): Region {
  if (markers.length === 0) {
    return {
      latitude: 48.8566,
      longitude: 2.3522,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  if (markers.length === 1) {
    return {
      latitude: markers[0].latitude,
      longitude: markers[0].longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }

  const lats = markers.map((m) => m.latitude);
  const lngs = markers.map((m) => m.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.04),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.04),
  };
}
