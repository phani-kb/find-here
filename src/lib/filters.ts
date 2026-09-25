import type { PlaceResult } from "@/lib/types";

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
