"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import type { Member } from "@/lib/api";

const AVATARS = ["#9CC5C2", "#D8C9A8", "#E3B9A0", "#A9B49A", "#8FB0B5", "#E8D5B5"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default function InviteMembers({ members, token }: { members: Member[]; token: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this invite link", link);
    }
  }

  return (
    <section className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex -space-x-2" aria-hidden="true">
          {members.slice(0, 5).map((m, i) => (
            <span
              key={i}
              title={m.name}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-shell"
              style={{ background: AVATARS[i % AVATARS.length] }}
            >
              {initials(m.name)}
            </span>
          ))}
          {members.length > 5 && (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white ring-2 ring-shell">
              +{members.length - 5}
            </span>
          )}
        </div>
        <p className="min-w-0 text-sm text-ink/80">
          <span className="font-medium text-ink">On this trip:</span>{" "}
          {members.map((m) => (m.is_me ? `${m.name} (you)` : m.name)).join(", ")}
        </p>
      </div>
      <button type="button" onClick={copy} className="btn btn-ghost btn-sm">
        {copied ? <Check size={16} aria-hidden className="text-lagoon" /> : <Link2 size={16} aria-hidden />}
        {copied ? "Link copied" : "Copy invite link"}
      </button>
    </section>
  );
}
