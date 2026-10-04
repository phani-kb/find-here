import type { SearchFilters } from "@/lib/filters";
import type { LatLng, Provider } from "@/lib/types";

export type SearchUrlState = {
  center: LatLng;
  radiusMiles: number;
  filters: SearchFilters;
  keyword: string;
  provider: Provider;
};

export function writeUrlState(state: SearchUrlState): string {
  const params = new URLSearchParams();
  params.set("lat", state.center.lat.toFixed(5));
  params.set("lng", state.center.lng.toFixed(5));
  params.set("r", String(state.radiusMiles));
  if (state.keyword) {
    params.set("q", state.keyword);
  }
  params.set("provider", state.provider);
  if (state.filters.minRating > 0) {
    params.set("rating", String(state.filters.minRating));
  }
  if (state.filters.minReviews > 0) {
    params.set("reviews", String(state.filters.minReviews));
  }
  return params.toString();
}
