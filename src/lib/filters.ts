import type { PlaceResult } from "@/lib/types";

// Places API (New) search cannot filter by rating or review count
export const MIN_RATING_OPTIONS = [0, 3, 3.5, 4, 4.5] as const;

export const MIN_REVIEW_OPTIONS = [
  0, 100, 500, 1000, 2000, 3000, 5000,
] as const;

export type SearchFilters = {
  minRating: number;
  minReviews: number;
};

export const DEFAULT_FILTERS: SearchFilters = {
  minRating: 0,
  minReviews: 0,
};

export function filtersActive(filters: SearchFilters): boolean {
  return filters.minRating > 0 || filters.minReviews > 0;
}

export function matchesFilters(
  place: PlaceResult,
  filters: SearchFilters,
): boolean {
  const rating = place.rating ?? 0;
  const reviews = place.userRatingCount ?? 0;
  return rating >= filters.minRating && reviews >= filters.minReviews;
}

export function filterPlaces(
  places: PlaceResult[],
  filters: SearchFilters,
): PlaceResult[] {
  if (!filtersActive(filters)) return places;
  return places.filter((place) => matchesFilters(place, filters));
}
