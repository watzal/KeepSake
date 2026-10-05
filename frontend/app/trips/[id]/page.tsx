"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Camera, Clock, ImagePlus, Layers, Sparkles, Users } from "lucide-react";
import {
  getTrip,
  listEvents,
  listPhotos,
  processTrip,
  uploadPhotos,
  type Photo,
  type Processing,
  type Trip,
  type TripEvent,
} from "@/lib/api";
import TripSearch from "@/components/TripSearch";
import TripRecap from "@/components/TripRecap";
import InviteMembers from "@/components/InviteMembers";
import PhotoGrid from "@/components/PhotoGrid";
import SiteHeader from "@/components/SiteHeader";

const BATCH = 8;
const POLL_MS = 2500;

function stageLabel(p: Processing) {
  if (p.stage === "embedding") return p.total ? `Looking at photos, ${p.done} of ${p.total}` : "Looking at photos";
  if (p.stage === "clustering") return "Grouping photos into moments";
  return p.total ? `Naming moments, ${p.done} of ${p.total}` : "Naming moments";
}

function eventTime(e: TripEvent) {
  if (!e.start_time) return null;
  const start = new Date(e.start_time);
  const day = start.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const end = e.end_time ? new Date(e.end_time) : start;
  if (end.getTime() - start.getTime() < 60_000) return `${day}, ${time(start)}`;
  if (end.toDateString() === start.toDateString()) return `${day}, ${time(start)} to ${time(end)}`;
  return `${day} to ${end.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

function ProgressBar({ pct }: { pct: number | null }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-mist/50">
      {pct === null ? (
        <div className="h-full w-1/3 animate-slide rounded-full bg-lagoon" />
      ) : (
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lagoon to-lagoon-light"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
}

export default function TripPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isLoaded && !!isSignedIn;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [t, p, e] = await Promise.all([getTrip(id), listPhotos(id), listEvents(id)]);
      setTrip(t);
      setPhotos(p);
      setEvents(e);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load this trip.");
    }
  }, [id]);

  useEffect(() => {
    if (signedIn) refresh();
  }, [signedIn, refresh]);

  const processing = trip?.processing ?? null;
  const organizing = processing?.status === "running";

  // while the pipeline runs, poll the trip for progress, then reload everything once it stops
  useEffect(() => {
    if (!organizing) return;
    const timer = setInterval(async () => {
      try {
        const t = await getTrip(id);
        if (t.processing?.status === "running") setTrip(t);
        else refresh();
      } catch {
        // a missed poll is fine, the next one will catch up
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [organizing, id, refresh]);

  async function handleOrganize() {
    setError(null);
    try {
      const started = await processTrip(id);
      setTrip((t) => (t ? { ...t, processing: started } : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start organizing.");
      refresh();
    }
  }

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!files.length) return;
    setError(null);
    setNotes([]);
    setProgress({ done: 0, total: files.length });
    const messages: string[] = [];
    try {
      for (let i = 0; i < files.length; i += BATCH) {
        const result = await uploadPhotos(id, files.slice(i, i + BATCH));
        if (result.duplicates.length) messages.push(`${result.duplicates.length} already in this trip, skipped`);
        result.failed.forEach((f) => messages.push(`${f.filename}: ${f.reason}`));
        setProgress({ done: Math.min(i + BATCH, files.length), total: files.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload stopped. Try again.");
    }
    setNotes(messages);
    setProgress(null);
    refresh();
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  const organizePct = processing?.total ? Math.round((processing.done / processing.total) * 100) : 0;
  const unorganized = photos.filter((p) => !p.event_id);
  const empty = photos.length === 0;
  const contributorCount = trip?.contributors?.length || 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <SiteHeader>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink/70 transition hover:text-lagoon">
            <ArrowLeft size={16} aria-hidden />
            All trips
          </Link>
        </SiteHeader>

        <main>
          {loadError && (
            <div className="card mt-4 p-8" role="alert">
              <h1 className="font-display text-3xl font-semibold">Could not open this trip</h1>
              <p className="mt-2 text-ink/75">{loadError}</p>
              <Link href="/" className="btn btn-ghost mt-5">
                Go to your trips
              </Link>
            </div>
          )}

          <header className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="eyebrow">Trip album</p>
              {trip ? (
                <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">{trip.name}</h1>
              ) : (
                !loadError && <div className="skeleton mt-3 h-12 w-72 max-w-full" aria-label="Loading" role="status" />
              )}
              {trip && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  <li className="chip">
                    <Camera size={14} aria-hidden className="text-lagoon" />
                    {trip.photo_count} {trip.photo_count === 1 ? "photo" : "photos"}
                  </li>
                  <li className="chip">
                    <Users size={14} aria-hidden className="text-lagoon" />
                    {contributorCount} {contributorCount === 1 ? "contributor" : "contributors"}
                  </li>
                  {events.length > 0 && (
                    <li className="chip">
                      <Layers size={14} aria-hidden className="text-lagoon" />
                      {events.length} {events.length === 1 ? "moment" : "moments"}
                    </li>
                  )}
                </ul>
              )}
            </div>
            {photos.length > 0 && (
              <button type="button" onClick={handleOrganize} disabled={organizing || !!progress} className="btn btn-primary">
                <Sparkles size={18} aria-hidden />
                {organizing ? "Organizing…" : events.length ? "Organize again" : "Organize photos"}
              </button>
            )}
          </header>

          {trip && <InviteMembers members={trip.members} token={trip.invite_token} />}

          {organizing && processing && (
            <section className="card mt-6 p-6" role="status" aria-live="polite">
              <p className="flex items-center gap-2 font-medium">
                <Sparkles size={18} aria-hidden className="animate-pulse text-lagoon" />
                {stageLabel(processing)}
              </p>
              <div className="mt-3">
                <ProgressBar pct={processing.total ? organizePct : null} />
              </div>
              <p className="mt-3 text-sm text-ink/70">
                The first run takes longer while the photo model loads. You can keep this page open.
              </p>
            </section>
          )}
          {processing?.status === "failed" && (
            <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Organizing stopped: {processing.error ?? "something went wrong"}. Try again.
            </p>
          )}

          <TripSearch tripId={id} ready={events.length > 0} />
          <TripRecap tripId={id} ready={events.length > 0} recap={trip?.recap ?? null} onDone={refresh} />

          <section
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`mt-6 rounded-2xl border-2 border-dashed transition-colors ${empty ? "px-8 py-14" : "p-6"} ${
              dragging ? "border-lagoon bg-lagoon/10" : "border-mist bg-shell/60"
            }`}
          >
            <div className={`flex flex-wrap items-center gap-4 ${empty ? "flex-col text-center" : ""}`}>
              {empty && (
                <>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lagoon/10 text-lagoon">
                    <ImagePlus size={26} aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">No photos yet</h2>
                    <p className="mt-1 text-ink/70">Add the first batch to get started.</p>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={!!progress}
                className="btn btn-primary"
              >
                <ImagePlus size={18} aria-hidden />
                Add photos
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <p className="text-ink/70">{dragging ? "Drop to upload" : "or drop them here"}</p>
            </div>

            {progress && (
              <div className="mt-6" role="status" aria-live="polite">
                <ProgressBar pct={pct} />
                <p className="mt-2 text-sm text-ink/70">
                  Uploading {progress.done} of {progress.total}
                </p>
              </div>
            )}
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {error}
              </p>
            )}
            {notes.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm text-ink/70">
                {notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </section>

          {empty ? null : events.length === 0 ? (
            <section className="mt-10">
              <PhotoGrid photos={photos} />
            </section>
          ) : (
            <>
              {events.map((e, i) => {
                const when = eventTime(e);
                return (
                  <section key={e.id} className="mt-14">
                    <div className="flex items-baseline gap-4 border-b border-mist/60 pb-4">
                      <span aria-hidden="true" className="font-display text-sm font-semibold tabular-nums text-lagoon">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-display text-2xl font-semibold sm:text-3xl">{e.name}</h2>
                        {e.description && <p className="mt-1 max-w-2xl text-ink/80">{e.description}</p>}
                        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/60">
                          <li className="flex items-center gap-1.5">
                            <Camera size={14} aria-hidden />
                            {e.photo_count} {e.photo_count === 1 ? "photo" : "photos"}
                          </li>
                          {e.contributors.length > 0 && (
                            <li className="flex items-center gap-1.5">
                              <Users size={14} aria-hidden />
                              {e.contributors.join(", ")}
                            </li>
                          )}
                          {when && (
                            <li className="flex items-center gap-1.5">
                              <Clock size={14} aria-hidden />
                              {when}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-5">
                      <PhotoGrid photos={e.photos} />
                    </div>
                  </section>
                );
              })}
              {unorganized.length > 0 && (
                <section className="mt-14">
                  <div className="border-b border-mist/60 pb-4">
                    <h2 className="font-display text-2xl font-semibold">Not organized yet</h2>
                    <p className="mt-1 text-sm text-ink/60">
                      {unorganized.length} new {unorganized.length === 1 ? "photo" : "photos"}. Press Organize again to
                      sort them in.
                    </p>
                  </div>
                  <div className="mt-5">
                    <PhotoGrid photos={unorganized} />
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
