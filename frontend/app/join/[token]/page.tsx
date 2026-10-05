"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { joinTrip } from "@/lib/api";
import { useDisplayName } from "@/lib/useDisplayName";
import Wordmark from "@/components/Wordmark";

export default function JoinPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const name = useDisplayName();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userLoaded || started.current) return;
    started.current = true;
    joinTrip(params.token, name)
      .then((res) => router.replace(`/trips/${res.id}`))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not join this trip."));
  }, [isLoaded, isSignedIn, userLoaded, name, params.token, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6">
      <Wordmark />
      <div className="card w-full p-8 text-center">
        {error ? (
          <>
            <h1 className="font-display text-3xl font-semibold">Could not join this trip</h1>
            <p role="alert" className="mt-3 text-ink/75">
              {error}
            </p>
            <Link href="/" className="btn btn-ghost mt-6">
              Go to your trips
            </Link>
          </>
        ) : (
          <p role="status" className="flex items-center justify-center gap-3 font-display text-2xl font-semibold">
            <Loader2 size={22} aria-hidden className="animate-spin text-lagoon" />
            Joining the trip…
          </p>
        )}
      </div>
    </main>
  );
}
