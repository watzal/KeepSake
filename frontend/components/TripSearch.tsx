"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { searchPhotos, type SearchResponse } from "@/lib/api";
import Lightbox from "@/components/Lightbox";

export default function TripSearch({ tripId, ready }: { tripId: string; ready: boolean }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || busy || !ready) return;
    setBusy(true);
    setError(null);
    try {
      setResponse(await searchPhotos(tripId, q));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Try again.");
    }
    setBusy(false);
  }

  function clear() {
    setResponse(null);
    setQuery("");
    setError(null);
  }

  return (
    <section className="mt-8">
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!ready}
            aria-label="Search photos"
            placeholder={ready ? "Search your trip, like “sunset at the beach”" : "Organize your photos to search them"}
            className="input w-full pl-11"
          />
        </div>
        <button type="submit" disabled={!ready || !query.trim() || busy} className="btn btn-primary">
          {busy ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {response && (
        <div className="card mt-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">
              {response.results.length} photos for “{response.query}”
            </h2>
            <button type="button" onClick={clear} className="btn btn-ghost btn-sm shrink-0">
              <X size={16} aria-hidden />
              Clear search
            </button>
          </div>
          {response.method === "local" && (
            <p className="mt-1 text-sm text-ink/60">
              The Atlas vector index is not ready yet, so this search ran locally. Try again in a minute.
            </p>
          )}
          {response.results.length === 0 ? (
            <p className="mt-4 text-ink/60">No photos matched. Try describing the scene instead of a name.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
              {response.results.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Open photo from ${p.contributor}`}
                  title={`${p.contributor}, ${p.filename}`}
                  className="group block aspect-square overflow-hidden rounded-lg bg-mist/40 ring-1 ring-ink/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb_url}
                    alt={p.filename}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* outside the card: its backdrop blur would trap a fixed overlay */}
      {response && <Lightbox photos={response.results} index={open} onChange={setOpen} />}
    </section>
  );
}
