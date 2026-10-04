"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import ResultsPanel from "@/components/results-panel";
import {
  DEFAULT_RADIUS_MILES,
  MILES_TO_METERS,
  RADIUS_OPTIONS_MILES,
} from "@/lib/geo";
import type {
  GeocodeResponse,
  LatLng,
  PlaceResult,
  Provider,
  SearchRequest,
  SearchResponse,
} from "@/lib/types";
import { DEFAULT_PROVIDER } from "@/lib/types";
import {
  DEFAULT_FILTERS,
  MIN_RATING_OPTIONS,
  MIN_REVIEW_OPTIONS,
  filterPlaces,
  filtersActive,
  type SearchFilters,
} from "@/lib/filters";
import { readUrlState, writeUrlState } from "@/lib/url-state";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-zinc-100 text-sm text-zinc-500">
      Loading map...
    </div>
  ),
});

type Status = "idle" | "loading" | "ready" | "error";

async function fetchSearch(
  center: LatLng,
  radiusMeters: number,
  keyword: string,
  minRating: number,
  provider: Provider,
  signal: AbortSignal,
): Promise<SearchResponse> {
  const body: SearchRequest = { center, radiusMeters, provider };
  if (keyword) body.keyword = keyword;
  if (keyword && minRating > 0) body.minRating = minRating;
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await response.json()) as SearchResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Search failed.");
  }
  return data;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getCurrentPosition(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export default function SearchApp() {
  const [urlState] = useState(() =>
    readUrlState(typeof window === "undefined" ? "" : window.location.search, {
      center: { lat: 0, lng: 0 },
      radiusMiles: DEFAULT_RADIUS_MILES,
      filters: DEFAULT_FILTERS,
      keyword: "",
      provider: DEFAULT_PROVIDER,
    }),
  );

  const [center, setCenter] = useState<LatLng | null>(
    urlState.hasCenter ? urlState.state.center : null,
  );
  const [centerLabel, setCenterLabel] = useState<string | null>(
    urlState.hasCenter ? "Shared location" : null,
  );
  const [searchedCenter, setSearchedCenter] = useState<LatLng | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<number>(
    urlState.state.radiusMiles,
  );
  const [searchedRadiusMiles, setSearchedRadiusMiles] = useState<number>(
    urlState.state.radiusMiles,
  );
  const [provider] = useState<Provider>(urlState.state.provider);
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState(urlState.state.keyword);
  const [keywordDraft, setKeywordDraft] = useState(urlState.state.keyword);
  const [rawResults, setRawResults] = useState<PlaceResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(urlState.state.filters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);

  const results = filterPlaces(rawResults, filters);

  const requestSearch = useCallback(
    async (
      nextCenter: LatLng,
      nextRadiusMeters: number,
      nextRadiusMiles: number,
      nextKeyword: string,
      nextMinRating: number,
    ) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus("loading");
      setError(null);
      setSearchedRadiusMiles(nextRadiusMiles);
      setSearchedCenter(nextCenter);
      try {
        const data = await fetchSearch(
          nextCenter,
          nextRadiusMeters,
          nextKeyword,
          nextMinRating,
          provider,
          controller.signal,
        );
        setRawResults(data.results);
        setSelectedId(null);
        setStatus("ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "Search failed.");
        setStatus("error");
      }
    },
    [provider],
  );
  const updateCenter = useCallback((next: LatLng, label: string) => {
    setCenter(next);
    setCenterLabel(label);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, provider }),
      });
      const data = (await response.json()) as GeocodeResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Location not found.");
      }
      updateCenter(data.center, data.label);
      requestSearch(
        data.center,
        MILES_TO_METERS(radiusMiles),
        radiusMiles,
        keyword,
        filters.minRating,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Location not found.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const handleUseMyLocation = async () => {
    setBusy(true);
    setError(null);
    const location = await getCurrentPosition();
    setBusy(false);

    if (!location) {
      setError("Could not get your location. Check your browser permissions.");
      setStatus("error");
      return;
    }

    updateCenter(location, "Your location");
    requestSearch(
      location,
      MILES_TO_METERS(radiusMiles),
      radiusMiles,
      keyword,
      filters.minRating,
    );
  };

  const submitKeyword = (next: string) => {
    if (!center) return;
    const trimmed = next.trim();
    setKeyword(trimmed);
    setKeywordDraft(trimmed);
    requestSearch(
      center,
      MILES_TO_METERS(radiusMiles),
      radiusMiles,
      trimmed,
      filters.minRating,
    );
  };

  useEffect(() => {
    if (!urlState.hasCenter) return;
    void requestSearch(
      urlState.state.center,
      MILES_TO_METERS(urlState.state.radiusMiles),
      urlState.state.radiusMiles,
      urlState.state.keyword,
      urlState.state.filters.minRating,
    );
  }, []);

  useEffect(() => {
    if (!center) return;
    const params = writeUrlState({
      center,
      radiusMiles,
      filters,
      keyword,
      provider,
    });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params}`,
    );
  }, [center, radiusMiles, filters, keyword, provider]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-3">
        <h1 className="mr-2 text-base font-semibold">Find Here</h1>

        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a city, address, or landmark"
            aria-label="Search a city, address, or landmark"
            className="min-w-48 max-w-lg flex-1 rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Search
          </button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitKeyword(keywordDraft);
          }}
          className="flex items-center gap-1"
        >
          <input
            type="text"
            value={keywordDraft}
            onChange={(event) => setKeywordDraft(event.target.value)}
            placeholder="Keyword, e.g. restaurant"
            aria-label="Filter by keyword"
            className="w-44 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy || !center}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            Filter
          </button>
          {keyword && (
            <button
              type="button"
              onClick={() => submitKeyword("")}
              className="rounded-md px-2 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Clear
            </button>
          )}
        </form>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Radius</span>
          <select
            value={radiusMiles}
            onChange={(event) => setRadiusMiles(Number(event.target.value))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
          >
            {RADIUS_OPTIONS_MILES.map((miles) => (
              <option key={miles} value={miles}>
                {miles} mi
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Min rating</span>
          <select
            value={filters.minRating}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                minRating: Number(event.target.value),
              }))
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
          >
            {MIN_RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating}>
                {rating === 0 ? "Any" : `${rating.toFixed(1)}+`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Min reviews</span>
          <select
            value={filters.minReviews}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                minReviews: Number(event.target.value),
              }))
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
          >
            {MIN_REVIEW_OPTIONS.map((reviews) => (
              <option key={reviews} value={reviews}>
                {reviews === 0 ? "Any" : `${reviews}+`}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={busy}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
        >
          Use my location
        </button>

        {radiusMiles !== searchedRadiusMiles && status !== "idle" && (
          <span className="text-xs text-amber-600">
            New radius applies on the next search.
          </span>
        )}
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="h-56 shrink-0 border-b border-zinc-200 bg-white md:h-auto md:w-80 md:border-b-0 md:border-r">
          <ResultsPanel
            results={results}
            totalCount={rawResults.length}
            filtersApplied={filtersActive(filters)}
            status={status}
            error={error}
            radiusLabel={`${searchedRadiusMiles} mi of ${centerLabel ?? "the searched center"}`}
            selectedId={selectedId}
            onSelectAction={setSelectedId}
          />
        </aside>

        <main className="relative flex-1 bg-zinc-100">
          {center ? (
            <MapView
              center={center}
              fitCenter={searchedCenter ?? center}
              radiusMeters={MILES_TO_METERS(searchedRadiusMiles)}
              results={results}
              selectedId={selectedId}
              onCenterAction={(next) => {
                setCenter(next);
                setCenterLabel(null);
              }}
              onSelectAction={setSelectedId}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-zinc-500">
              Map Google/OSM
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
