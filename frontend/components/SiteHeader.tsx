"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import Wordmark from "@/components/Wordmark";

export default function SiteHeader({ children }: { children?: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between gap-4">
      <Wordmark />
      <div className="flex items-center gap-4">
        {children}
        {isLoaded && isSignedIn && <UserButton />}
      </div>
    </header>
  );
}
