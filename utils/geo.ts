const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function getDistanceInMiles(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
): number {
  const latDelta = toRadians(end.latitude - start.latitude);
  const lngDelta = toRadians(end.longitude - start.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(start.latitude)) *
      Math.cos(toRadians(end.latitude)) *
      Math.sin(lngDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceMiles(distanceMiles: number): string {
  if (distanceMiles >= 100) return Math.round(distanceMiles).toString();
  if (distanceMiles >= 10) return distanceMiles.toFixed(1);
  return distanceMiles.toFixed(1);
}
