import { MIN_RATING_OPTIONS, MIN_REVIEW_OPTIONS } from "@/lib/filters";
import type { SearchFilters } from "@/lib/filters";
import { isValidLatLng, RADIUS_OPTIONS_MILES } from "@/lib/geo";
import type { LatLng, Provider } from "@/lib/types";

export type SearchUrlState = {
  center: LatLng;
  radiusMiles: number;
  filters: SearchFilters;
  keyword: string;
  provider: Provider;
};

function firstAllowed<T extends number>(
  value: number | null,
  allowed: readonly T[],
): T | undefined {
  if (value === null || !Number.isFinite(value)) return undefined;
  return allowed.find((option) => option === value);
}

function parseProvider(value: string | null): Provider | undefined {
  return value === "google" || value === "osm" ? value : undefined;
}

export function readUrlState(
  search: string,
  fallback: SearchUrlState,
): { state: SearchUrlState; hasCenter: boolean } {
  const params = new URLSearchParams(search);
  const hasCenter = params.has("lat") && params.has("lng");
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const centerIsValid = hasCenter && isValidLatLng({ lat, lng });

  const radiusMiles = firstAllowed(
    params.has("r") ? Number(params.get("r")) : null,
    RADIUS_OPTIONS_MILES,
  );
  const minRating = firstAllowed(
    params.has("rating") ? Number(params.get("rating")) : null,
    MIN_RATING_OPTIONS,
  );
  const minReviews = firstAllowed(
    params.has("reviews") ? Number(params.get("reviews")) : null,
    MIN_REVIEW_OPTIONS,
  );
  const keyword = params.get("q")?.trim() ?? "";
  const provider = parseProvider(params.get("provider")) ?? fallback.provider;

  return {
    state: {
      center: centerIsValid ? { lat, lng } : fallback.center,
      radiusMiles: radiusMiles ?? fallback.radiusMiles,
      filters: {
        minRating: minRating ?? fallback.filters.minRating,
        minReviews: minReviews ?? fallback.filters.minReviews,
      },
      keyword: keyword || fallback.keyword,
      provider,
    },
    hasCenter: centerIsValid,
  };
}

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
