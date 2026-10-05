"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { createRecap, type Recap } from "@/lib/api";

export default function TripRecap({
  tripId,
  ready,
  recap,
  onDone,
}: {
  tripId: string;
  ready: boolean;
  recap: Recap | null;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      await createRecap(tripId);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the recap. Try again.");
    }
    setBusy(false);
  }

  return (
    <section className="card relative mt-6 overflow-hidden p-6">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-lagoon-light to-sand" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lagoon/10 text-lagoon">
            <Mic size={20} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold">Trip recap</h2>
            <p className="mt-0.5 text-sm text-ink/70">
              {ready ? "A short story of your trip, read aloud." : "Organize your photos to create a recap."}
            </p>
          </div>
        </div>
        <button type="button" onClick={generate} disabled={!ready || busy} className="btn btn-primary">
          {busy ? "Writing and narrating…" : recap ? "Create a new recap" : "Create recap"}
        </button>
      </div>

      {busy && (
        <div role="status" aria-live="polite" className="mt-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-mist/50">
            <div className="h-full w-1/3 animate-slide rounded-full bg-lagoon" />
          </div>
          <p className="mt-2 text-sm text-ink/70">This takes about 10 to 20 seconds.</p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {recap && !busy && (
        <div className="mt-6 border-t border-mist/50 pt-6">
          {recap.audio_url ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio controls src={recap.audio_url} className="w-full" />
          ) : (
            recap.audio_error && <p className="text-sm text-red-700">{recap.audio_error}</p>
          )}
          <p className="mt-5 max-w-2xl border-l-2 border-sand pl-4 font-display text-lg leading-relaxed text-ink/90">
            {recap.script}
          </p>
          <p className="mt-3 text-sm text-ink/60">
            {recap.ai_written ? "Written by Gemma from your moments." : "Written from your moment names."}
          </p>
        </div>
      )}
    </section>
  );
}
