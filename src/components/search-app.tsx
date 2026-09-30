"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
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
  provider: Provider,
  signal: AbortSignal,
): Promise<SearchResponse> {
  const body: SearchRequest = { center, radiusMeters, provider };
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

export default function SearchApp() {
  const [center, setCenter] = useState<LatLng | null>(null);
  const [centerLabel, setCenterLabel] = useState<string | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<number>(DEFAULT_RADIUS_MILES);
  const [searchedRadiusMiles, setSearchedRadiusMiles] =
    useState<number>(DEFAULT_RADIUS_MILES);
  const [provider] = useState<Provider>(DEFAULT_PROVIDER);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);

  const requestSearch = useCallback(
    (nextCenter: LatLng, nextRadiusMeters: number, nextRadiusMiles: number) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus("loading");
      setError(null);
      setSearchedRadiusMiles(nextRadiusMiles);
      fetchSearch(nextCenter, nextRadiusMeters, provider, controller.signal)
        .then((data) => {
          setResults(data.results);
          setSelectedId(null);
          setStatus("ready");
        })
        .catch((err: unknown) => {
          if (isAbortError(err)) return;
          setError(err instanceof Error ? err.message : "Search failed.");
          setStatus("error");
        });
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
      requestSearch(data.center, MILES_TO_METERS(radiusMiles), radiusMiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Location not found.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

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

        {radiusMiles !== searchedRadiusMiles && status !== "idle" && (
          <span className="text-xs text-amber-600">
            Press Search to apply the new radius.
          </span>
        )}
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="h-56 shrink-0 border-b border-zinc-200 bg-white md:h-auto md:w-80 md:border-b-0 md:border-r">
          <ResultsPanel
            results={results}
            totalCount={results.length}
            filtersApplied={false}
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
              radiusMeters={MILES_TO_METERS(searchedRadiusMiles)}
              results={results}
              selectedId={selectedId}
              onCenterAction={(next) => {
                setCenter(next);
                setCenterLabel(null);
                requestSearch(next, MILES_TO_METERS(radiusMiles), radiusMiles);
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
