"use client";

import { useAuth } from "@clerk/nextjs";
import { setTokenGetter } from "@/lib/api";

// Lets the plain fetch helpers in lib/api.ts attach the signed-in user's session token.
export default function AuthBridge() {
  const { getToken } = useAuth();
  setTokenGetter(() => getToken());
  return null;
}
