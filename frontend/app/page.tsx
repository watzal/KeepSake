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

// A contact sheet: each frame is a muted stand-in for the kind of group the app will find.
const FRAMES = [
  { label: "Beach", bg: "linear-gradient(180deg, #9CC5C2 0%, #C4DDD8 58%, #E4D6B4 58%, #D8C9A8 100%)", tilt: -3 },
  { label: "Dinner", bg: "radial-gradient(circle at 50% 70%, #F0DDB8 0%, #D8C9A8 45%, #B7A27A 100%)", tilt: 2 },
  {
    label: "Sunset",
    bg: "radial-gradient(circle at 50% 62%, #F6E3B4 0 9%, transparent 10%), linear-gradient(180deg, #D99A82 0%, #EFC7A2 62%, #7C8FA0 62%, #5F7486 100%)",
    tilt: -1.5,
  },
  { label: "Fort", bg: "linear-gradient(180deg, #CBD8D4 0%, #DDE5E1 45%, #A9B49A 45%, #8C9A7E 100%)", tilt: 1.5 },
  {
    label: "Night out",
    bg: "radial-gradient(circle at 25% 35%, #E8D5B5 0 3%, transparent 4%), radial-gradient(circle at 70% 55%, #E3B9A0 0 4%, transparent 5%), radial-gradient(circle at 45% 75%, #9CC5C2 0 3%, transparent 4%), linear-gradient(180deg, #2F4250 0%, #4B5F6B 100%)",
    tilt: -2,
  },
  { label: "Travel", bg: "linear-gradient(180deg, #DCE4E2 0%, #C7D2D0 50%, #9FB1B3 50%, #8A9FA2 100%)", tilt: 3 },
  { label: "Friends", bg: "radial-gradient(circle at 30% 30%, #F5E8CF 0%, #E8D5B5 50%, #D4BB93 100%)", tilt: 2 },
  { label: "Market", bg: "linear-gradient(180deg, #E3C9A4 0%, #D9B58C 40%, #B7A98C 40%, #9C8E72 100%)", tilt: -2.5 },
  { label: "Stay", bg: "linear-gradient(180deg, #C9D9D6 0%, #A9C3C4 55%, #8FB0B5 55%, #7499A0 100%)", tilt: 1 },
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
                              style={{ background: FRAMES[i % FRAMES.length].bg }}
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

          <section aria-hidden="true" className="grid grid-cols-3 gap-4 sm:gap-5">
            {FRAMES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 24, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: f.tilt, transition: { delay: 0.15 + i * 0.05 } }}
                whileHover={{ rotate: 0, scale: 1.05, y: -6 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="rounded-sm bg-white p-2 pb-7 shadow-print"
              >
                <div className="aspect-[4/5] rounded-[1px]" style={{ background: f.bg }} />
                <p className="mt-2 font-display text-xs text-ink/60">{f.label}</p>
              </motion.div>
            ))}
          </section>
        </main>
      </div>
    </MotionConfig>
  );
}
