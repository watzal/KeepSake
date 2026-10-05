"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Mic, Search, Sparkles } from "lucide-react";
import { createTrip, listTrips, type TripSummary } from "@/lib/api";
import { useDisplayName } from "@/lib/useDisplayName";
import SiteHeader from "@/components/SiteHeader";
import HeroCollage from "@/components/HeroCollage";

// soft washes used as the thumbnail of each trip in the list
const TILES = [
  "linear-gradient(135deg, #9CC5C2, #5FAFA8)",
  "linear-gradient(135deg, #F8D7A4, #E88F73)",
  "linear-gradient(135deg, #D8C9A8, #B98A5E)",
  "linear-gradient(135deg, #CFE1DD, #84A074)",
  "linear-gradient(135deg, #3E546B, #1C2B3A)",
];

const FEATURES = [
  { icon: Sparkles, text: "Moments named for you" },
  { icon: Search, text: "Search by describing a scene" },
  { icon: Mic, text: "A narrated recap" },
];

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const displayName = useDisplayName();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trips, setTrips] = useState<TripSummary[] | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    listTrips()
      .then(setTrips)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your trips."));
  }, [isLoaded, isSignedIn]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const trip = await createTrip({ name: name.trim(), display_name: displayName });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the trip. Is the API running?");
      setBusy(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl px-6">
        <SiteHeader />
        <main className="grid items-center gap-14 pb-16 pt-6 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[1fr_1.1fr] lg:pt-0">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="eyebrow">Shared trip albums</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Upload everything. <span className="text-lagoon">Organize nothing.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/75">
              Add every photo from the trip, yours and your friends&apos;. Keepsake groups them into
              the places and moments you actually remember.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="chip">
                  <Icon size={14} aria-hidden className="text-lagoon" />
                  {text}
                </li>
              ))}
            </ul>

            {isLoaded && !isSignedIn && (
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/sign-up" className="btn btn-primary">
                  Create an account
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link href="/sign-in" className="btn btn-ghost">
                  Sign in
                </Link>
              </div>
            )}

            {isLoaded && isSignedIn && (
              <>
                <form onSubmit={onSubmit} className="mt-10 max-w-md">
                  <label htmlFor="trip-name" className="text-sm font-medium">
                    Name your trip
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="trip-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Goa 2026"
                      maxLength={120}
                      className="input min-w-0 flex-1"
                    />
                    <button type="submit" disabled={!name.trim() || busy} className="btn btn-primary">
                      {busy ? "Creating…" : "Create trip"}
                    </button>
                  </div>
                </form>

                {!trips && !error && (
                  <div className="mt-10 max-w-md space-y-2" aria-hidden="true">
                    <div className="skeleton h-16" />
                    <div className="skeleton h-16" />
                  </div>
                )}

                {trips && trips.length > 0 && (
                  <div className="mt-10 max-w-md">
                    <h2 className="font-display text-2xl font-semibold">Your trips</h2>
                    <ul className="mt-3 space-y-2">
                      {trips.map((t, i) => (
                        <li key={t.id}>
                          <Link
                            href={`/trips/${t.id}`}
                            className="card group flex items-center gap-4 p-3 transition hover:-translate-y-0.5 hover:border-lagoon/40"
                          >
                            <span
                              aria-hidden="true"
                              className="h-11 w-11 shrink-0 rounded-lg"
                              style={{ background: TILES[i % TILES.length] }}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{t.name}</span>
                              <span className="block text-sm text-ink/60">
                                {t.photo_count} photos, {t.member_count} {t.member_count === 1 ? "person" : "people"}
                              </span>
                            </span>
                            <ArrowRight
                              size={18}
                              aria-hidden
                              className="mr-1 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-lagoon"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </motion.section>

          <HeroCollage />
        </main>
      </div>
    </MotionConfig>
  );
}
