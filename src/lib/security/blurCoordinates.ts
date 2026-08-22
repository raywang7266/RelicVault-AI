/**
 * Utility function to obfuscate exact geographic coordinates for public artifact displays.
 * Protects vulnerable heritage sites from unauthorized looting or damage by injecting
 * a controlled random offset into latitude and longitude.
 */

export interface BlurCoordinatesOptions {
  isProtected?: boolean;
  minRadiusMeters?: number;
  maxRadiusMeters?: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Approximate earth radius in meters
const EARTH_RADIUS_METERS = 6371000;

export function blurCoordinates(
  lat: number,
  lng: number,
  options: BlurCoordinatesOptions = {}
): Coordinates {
  const {
    isProtected = false,
    minRadiusMeters = 500,
    maxRadiusMeters = 1000,
  } = options;

  // Officially protected sites keep exact coordinates for verification
  if (isProtected) {
    return { latitude: lat, longitude: lng };
  }

  // Generate uniform random distance within [minRadiusMeters, maxRadiusMeters]
  const randomDistance =
    minRadiusMeters + Math.random() * (maxRadiusMeters - minRadiusMeters);

  // Random angle in radians (0 to 2π)
  const randomAngle = Math.random() * 2 * Math.PI;

  // Convert distance in meters to angular distance in radians
  const angularDistance = randomDistance / EARTH_RADIUS_METERS;

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  // Spherical offset calculations
  const blurredLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(randomAngle)
  );

  const blurredLngRad =
    lngRad +
    Math.atan2(
      Math.sin(randomAngle) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(blurredLatRad)
    );

  // Convert back to decimal degrees
  const blurredLat = (blurredLatRad * 180) / Math.PI;
  const blurredLng = (blurredLngRad * 180) / Math.PI;

  return {
    latitude: Number(blurredLat.toFixed(6)),
    longitude: Number(blurredLng.toFixed(6)),
  };
}

/**
 * Helper to compute Haversine distance between two points in meters (for testing)
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const toRad = (val: number) => (val * Math.PI) / 180;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLng = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}