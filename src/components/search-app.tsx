"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { DEFAULT_RADIUS_MILES, RADIUS_OPTIONS_MILES } from "@/lib/geo";

export default function SearchApp() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number>(DEFAULT_RADIUS_MILES);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSearchedQuery(query.trim());
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mr-2 text-base font-semibold">Find Here</h1>

        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a city, address, or landmark"
            aria-label="Search a city, address, or landmark"
            className="min-w-48 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Radius</span>
          <select
            value={radiusMiles}
            onChange={(event) => setRadiusMiles(Number(event.target.value))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {RADIUS_OPTIONS_MILES.map((miles) => (
              <option key={miles} value={miles}>
                {miles} mi
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="h-56 shrink-0 border-b border-zinc-200 bg-white p-4 md:h-auto md:w-80 md:border-b-0 md:border-r dark:border-zinc-800 dark:bg-zinc-950">
          {searchedQuery ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Results for &ldquo;{searchedQuery}&rdquo; within {radiusMiles} mi
            </p>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Search for a city, address, or landmark to see places nearby.
            </p>
          )}
        </aside>

        <main className="relative flex-1 bg-zinc-100 dark:bg-zinc-900">
          <div className="grid h-full place-items-center text-sm text-zinc-500">
            Map Google/OSM
          </div>
        </main>
      </div>
    </div>
  );
}
