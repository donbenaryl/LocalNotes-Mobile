import type { Item, ListItemDAO, Location } from "@/http/list-api/types";

export interface MapPick {
  item: Item;
  index: number;
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  categoryLabel: string;
}

export function getPickName(item: Item): string {
  return item.business?.name ?? item.unverified_business?.name ?? "";
}

export function getPickCategoryLabel(item: Item): string {
  if (item.business?.business_type) {
    return item.business.business_type;
  }
  if (item.tags.length > 0) {
    return item.tags.map((tag) => tag.name).join(" · ");
  }
  return "";
}

export function formatPickAddress(
  item: Item,
  listLocation?: Location | null,
): string {
  const location = item.location ?? item.business?.branches?.[0]?.location ?? null;

  if (location?.street_address) {
    const parts = [location.street_address, location.city].filter(Boolean);
    return parts.join(", ");
  }

  if (location?.city) {
    const cityPart = location.region
      ? `${location.city}, ${location.region}`
      : location.city;
    return `${cityPart}${location.country ? `, ${location.country}` : ""}`.trim();
  }

  if (item.business?.location) {
    return item.business.location;
  }

  if (listLocation?.city) {
    return [listLocation.city, listLocation.region, listLocation.country]
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function hasValidCoordinates(location?: Location | null): location is Location {
  return (
    location != null &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    !Number.isNaN(location.latitude) &&
    !Number.isNaN(location.longitude) &&
    !(location.latitude === 0 && location.longitude === 0)
  );
}

function resolveItemLocation(item: Item): Location | null {
  if (hasValidCoordinates(item.location)) {
    return item.location;
  }

  const branchLocation = item.business?.branches?.[0]?.location;
  if (hasValidCoordinates(branchLocation)) {
    return branchLocation;
  }

  return null;
}

function spreadAroundListLocation(
  listLocation: Location,
  index: number,
  total: number,
): { latitude: number; longitude: number } {
  const baseLat = listLocation.latitude;
  const baseLng = listLocation.longitude;
  const offset = 0.003;

  if (total <= 1) {
    return { latitude: baseLat, longitude: baseLng };
  }

  const angle = (index / total) * Math.PI * 2;
  return {
    latitude: baseLat + offset * Math.sin(angle),
    longitude: baseLng + offset * Math.cos(angle),
  };
}

export function resolvePickCoordinates(
  item: Item,
  index: number,
  listLocation?: Location | null,
  totalPicks = 1,
): { latitude: number; longitude: number } | null {
  const direct = resolveItemLocation(item);
  if (direct) {
    return { latitude: direct.latitude, longitude: direct.longitude };
  }

  if (hasValidCoordinates(listLocation)) {
    return spreadAroundListLocation(listLocation, index, totalPicks);
  }

  return null;
}

export function buildMapPicks(list: ListItemDAO): MapPick[] {
  const items = list.items ?? [];
  const total = items.length;

  return items
    .map((item, index) => {
      const coords = resolvePickCoordinates(item, index, list.location, total);
      if (!coords) return null;

      const name = getPickName(item);
      if (!name) return null;

      return {
        item,
        index,
        latitude: coords.latitude,
        longitude: coords.longitude,
        name,
        address: formatPickAddress(item, list.location),
        categoryLabel: getPickCategoryLabel(item),
      };
    })
    .filter((pick): pick is MapPick => pick != null);
}

export function getMapRegion(picks: MapPick[]) {
  if (picks.length === 0) {
    return {
      latitude: 48.8566,
      longitude: 2.3522,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  if (picks.length === 1) {
    return {
      latitude: picks[0].latitude,
      longitude: picks[0].longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }

  const lats = picks.map((pick) => pick.latitude);
  const lngs = picks.map((pick) => pick.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max((maxLat - minLat) * 1.4, 0.02);
  const lngDelta = Math.max((maxLng - minLng) * 1.4, 0.02);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}
