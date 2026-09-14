import type { Region } from "react-native-maps";
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { ListItemDAO, ListItemPublic, Location } from "@/http/list-api/types";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import type { EffectiveSearchCoordinates } from "@/hooks/useEffectiveSearchLocation";
import type { SearchLocationMode } from "@/stores/useSearchStore";

export const SEARCH_MAP_RADIUS_KM = 15;

export type SearchMapMarkerKind = "list" | "business" | "pick" | "person";

type SearchMapMarkerBase = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
};

export type SearchMapMarker =
  | (SearchMapMarkerBase & { kind: "list"; items: ListItemDAO[] })
  | (SearchMapMarkerBase & { kind: "business"; items: BusinessItemDAO[] })
  | (SearchMapMarkerBase & { kind: "pick"; items: ListItemPublic[] })
  | (SearchMapMarkerBase & { kind: "person"; items: UnifiedSearchPersonDAO[] });

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

/** Match web MapPanel: collapse pins that share the same 6-decimal lat/lng. */
function locationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}:${longitude.toFixed(6)}`;
}

function markerId(
  kind: SearchMapMarkerKind,
  latitude: number,
  longitude: number,
): string {
  return `${kind}:${locationKey(latitude, longitude)}`;
}

/** List pins sit at the list's geographic center (handoff 05.A.1). */
export function buildListMapMarkers(lists: ListItemDAO[]): SearchMapMarker[] {
  const grouped = new Map<string, SearchMapMarker & { kind: "list" }>();

  for (const list of lists) {
    if (!hasValidCoordinates(list.location)) continue;
    const { latitude, longitude } = list.location;
    const key = locationKey(latitude, longitude);
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(list);
      continue;
    }
    grouped.set(key, {
      id: markerId("list", latitude, longitude),
      kind: "list",
      latitude,
      longitude,
      title: list.name,
      subtitle: list.location.city || undefined,
      items: [list],
    });
  }

  return Array.from(grouped.values());
}

/** Place pins use the first branch with valid coordinates (web MapPanel). */
export function buildBusinessMapMarkers(
  businesses: BusinessItemDAO[],
): SearchMapMarker[] {
  const grouped = new Map<string, SearchMapMarker & { kind: "business" }>();

  for (const business of businesses) {
    const branch =
      business.branches?.find((b) => hasValidCoordinates(b.location)) ?? null;
    const fallback = hasValidCoordinates(business.location)
      ? business.location
      : null;
    const location = branch?.location ?? fallback;
    if (!location || !hasValidCoordinates(location)) continue;

    const { latitude, longitude } = location;
    const key = locationKey(latitude, longitude);
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(business);
      continue;
    }
    grouped.set(key, {
      id: markerId("business", latitude, longitude),
      kind: "business",
      latitude,
      longitude,
      title: business.name,
      subtitle: location.city || business.business_type || undefined,
      items: [business],
    });
  }

  return Array.from(grouped.values());
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
  const grouped = new Map<string, SearchMapMarker & { kind: "pick" }>();

  for (const pick of picks) {
    if (!hasValidCoordinates(pick.location)) continue;
    const { latitude, longitude } = pick.location;
    const key = locationKey(latitude, longitude);
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(pick);
      continue;
    }
    grouped.set(key, {
      id: markerId("pick", latitude, longitude),
      kind: "pick",
      latitude,
      longitude,
      title: pickTitle(pick),
      subtitle: pick.location.city || undefined,
      items: [pick],
    });
  }

  return Array.from(grouped.values());
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
  const grouped = new Map<string, SearchMapMarker & { kind: "person" }>();

  for (const person of people) {
    if (!hasValidCoordinates(person.location)) continue;
    const { latitude, longitude } = person.location;
    const key = locationKey(latitude, longitude);
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(person);
      continue;
    }
    grouped.set(key, {
      id: markerId("person", latitude, longitude),
      kind: "person",
      latitude,
      longitude,
      title: person.name,
      subtitle: person.location.city || undefined,
      items: [person],
    });
  }

  return Array.from(grouped.values());
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
