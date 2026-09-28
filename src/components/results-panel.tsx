"use client";

import { formatDistance } from "@/lib/geo";
import type { PlaceResult } from "@/lib/types";

type ResultsPanelProps = {
  results: PlaceResult[];
  totalCount: number;
  filtersApplied: boolean;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  radiusLabel: string;
  selectedId: string | null;
  onSelectAction: (id: string) => void;
};

export default function ResultsPanel({
  results,
  totalCount,
  filtersApplied,
  status,
  error,
  radiusLabel,
  selectedId,
  onSelectAction,
}: ResultsPanelProps) {
  const countLabel =
    filtersApplied && results.length !== totalCount
      ? `${results.length} of ${totalCount} place(s)`
      : `${results.length} place(s)`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Results</h2>
        <p aria-live="polite" className="text-xs text-zinc-500">
          {status === "idle"
            ? "No search yet"
            : status === "loading"
              ? "Searching..."
              : status === "error"
                ? "Search failed"
                : `${countLabel} within ${radiusLabel}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === "error" && (
          <p className="p-4 text-sm text-red-600">{error}</p>
        )}

        {status === "ready" && results.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">
            {filtersApplied && totalCount > 0
              ? "No places match the minimum rating or review count. Lower the filters to see more."
              : "No places found in this circle. Try a larger radius or a different center."}
          </p>
        )}

        {status === "loading" && (
          <ul className="divide-y divide-zinc-100">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="animate-pulse space-y-2 p-4">
                <div className="h-4 w-2/3 rounded bg-zinc-200" />
                <div className="h-3 w-full rounded bg-zinc-100" />
              </li>
            ))}
          </ul>
        )}

        {status !== "loading" && results.length > 0 && (
          <ul className="divide-y divide-zinc-100">
            {results.map((place) => {
              const selected = place.id === selectedId;
              return (
                <li key={place.id}>
                  <div
                    className={`flex items-start gap-2 transition-colors hover:bg-zinc-50 ${
                      selected ? "bg-blue-50" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectAction(place.id)}
                      className="min-w-0 flex-1 px-4 py-3 text-left"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {place.name}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                          {formatDistance(place.distanceMeters)}
                        </span>
                      </div>
                      {place.address && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                          {place.address}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        {typeof place.rating === "number" && (
                          <span>
                            ★ {place.rating.toFixed(1)}
                            {typeof place.userRatingCount === "number"
                              ? ` (${place.userRatingCount})`
                              : ""}
                          </span>
                        )}
                        {place.primaryType && (
                          <span className="truncate">
                            {place.primaryType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </button>
                    {place.mapLink && (
                      <a
                        href={place.mapLink.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 shrink-0 pr-4 text-xs font-medium text-blue-600 hover:underline"
                      >
                        {place.mapLink.label}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
