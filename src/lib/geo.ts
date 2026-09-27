import type { LatLng, PlaceResult } from "@/lib/types";

export const METERS_PER_MILE = 1609.344;

// google api cap at 50k meters, ~31 mi
export const RADIUS_OPTIONS_MILES = [1, 2, 3, 5, 10, 15, 20, 25, 30] as const;

export const MAX_RADIUS_METERS = 50_000;

export const DEFAULT_RADIUS_MILES = 5;

export const MILES_TO_METERS = (miles: number) =>
  Math.round(miles * METERS_PER_MILE);

export const METERS_TO_MILES = (meters: number) => meters / METERS_PER_MILE;

export function isValidLatLng(value: unknown): value is LatLng {
  if (typeof value !== "object" || value === null) return false;
  const { lat, lng } = value as Record<string, unknown>;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function sortByDistance(results: PlaceResult[]): PlaceResult[] {
  return [...results].sort((a, b) => a.distanceMeters - b.distanceMeters);
}
