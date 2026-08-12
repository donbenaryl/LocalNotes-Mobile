import type { Region } from "react-native-maps";
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { ListItemDAO, ListItemPublic, Location } from "@/http/list-api/types";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import type { EffectiveSearchCoordinates } from "@/hooks/useEffectiveSearchLocation";
import type { SearchLocationMode } from "@/stores/useSearchStore";

export const SEARCH_MAP_RADIUS_KM = 15;

export type SearchMapMarkerKind = "list" | "business" | "pick" | "person";

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

function pickTitle(pick: ListItemPublic): string {
  const fromBusiness = pick.business_name?.trim();
  if (fromBusiness) return fromBusiness;
  const fromOthers = pick.others_name?.trim();
  if (fromOthers) return fromOthers;
  const fromDescription = pick.description?.trim();
  if (fromDescription) {
    return fromDescription.length > 40
      ? `${fromDescription.slice(0, 40)}…`
      : fromDescription;
  }
  return "Pick";
}

/** Pick pins use each pick's own location when geocoded. */
export function buildPickMapMarkers(picks: ListItemPublic[]): SearchMapMarker[] {
  const markers: SearchMapMarker[] = [];

  for (const pick of picks) {
    if (!hasValidCoordinates(pick.location)) continue;
    markers.push({
      id: `pick-${pick.id}`,
      kind: "pick",
      latitude: pick.location.latitude,
      longitude: pick.location.longitude,
      title: pickTitle(pick),
      subtitle: pick.location.city || undefined,
    });
  }

  return markers;
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchesCityRegion(
  personLocation: UnifiedSearchPersonDAO["location"],
  city: string,
  region?: string,
): boolean {
  if (!personLocation?.city) return false;
  if (personLocation.city.toLowerCase() !== city.toLowerCase()) return false;
  if (region && personLocation.region) {
    return personLocation.region.toLowerCase() === region.toLowerCase();
  }
  return true;
}

/** Keep map pins aligned with the active location filter (same source data as the list). */
export function filterPeopleForMap(
  people: UnifiedSearchPersonDAO[],
  location: EffectiveSearchCoordinates | null,
  locationMode: SearchLocationMode,
  radiusKm = SEARCH_MAP_RADIUS_KM,
): UnifiedSearchPersonDAO[] {
  if (locationMode === "all" || !location) {
    return people;
  }

  if (location.city) {
    return people.filter((person) =>
      matchesCityRegion(person.location, location.city!, location.region),
    );
  }

  return people.filter((person) => {
    if (!hasValidCoordinates(person.location)) return false;
    return (
      distanceKm(
        location.latitude,
        location.longitude,
        person.location.latitude,
        person.location.longitude,
      ) <= radiusKm
    );
  });
}

/** People pins use home location coords when privacy allows (API may omit lat/lng). */
export function buildPeopleMapMarkers(
  people: UnifiedSearchPersonDAO[],
): SearchMapMarker[] {
  const markers: SearchMapMarker[] = [];

  for (const person of people) {
    if (!hasValidCoordinates(person.location)) continue;
    markers.push({
      id: `person-${person.id}`,
      kind: "person",
      latitude: person.location.latitude,
      longitude: person.location.longitude,
      title: person.name,
      subtitle: person.location.city || undefined,
    });
  }

  return markers;
}

export type MapFallbackCenter = {
  latitude: number;
  longitude: number;
} | null;

/** Empty-map camera when no pins and no home/device/list center. */
export const WORLD_OVERVIEW_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 80,
  longitudeDelta: 160,
};

const EMPTY_FALLBACK_DELTA = 0.08;

export function getSearchMapRegion(
  markers: SearchMapMarker[],
  fallbackCenter?: MapFallbackCenter,
): Region {
  if (markers.length === 0) {
    if (fallbackCenter) {
      return {
        latitude: fallbackCenter.latitude,
        longitude: fallbackCenter.longitude,
        latitudeDelta: EMPTY_FALLBACK_DELTA,
        longitudeDelta: EMPTY_FALLBACK_DELTA,
      };
    }
    return WORLD_OVERVIEW_REGION;
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
