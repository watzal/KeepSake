"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { Photo } from "@/lib/api";

export default function Lightbox({
  photos,
  index,
  onChange,
}: {
  photos: Photo[];
  index: number | null;
  onChange: (index: number | null) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const photo = index !== null ? photos[index] : null;
  const count = photos.length;
  const ratio = photo && photo.width > 0 && photo.height > 0 ? photo.width / photo.height : null;

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") onChange((index! + 1) % count);
      if (e.key === "ArrowLeft") onChange((index! - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, onChange]);

  // lock the page behind the viewer and hand focus back when it closes
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {photo && index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onChange(null)}
          className="fixed inset-0 z-50 flex flex-col bg-ink/90 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium">{photo.contributor}</span>
              <span className="text-white/60">
                {" "}
                · {index + 1} of {count}
              </span>
            </p>
            <div className="flex items-center gap-1">
              <a
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <ExternalLink size={16} aria-hidden />
                Open original
              </a>
              <button
                ref={closeRef}
                type="button"
                onClick={() => onChange(null)}
                aria-label="Close"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-white"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={photo.id}
              src={photo.url}
              alt={photo.filename}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                // originals the browser cannot draw fall back to the thumbnail
                const el = e.currentTarget;
                if (el.dataset.fallback) return;
                el.dataset.fallback = "1";
                el.src = photo.thumb_url;
              }}
              // sized from the photo's shape so small photos grow to fill the space, not just large ones shrink
              style={
                ratio
                  ? { aspectRatio: ratio, width: `min(100%, calc((100dvh - 5.5rem) * ${ratio}))`, height: "auto" }
                  : undefined
              }
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange((index - 1 + count) % count);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-white sm:left-4"
                >
                  <ChevronLeft size={22} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange((index + 1) % count);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-white sm:right-4"
                >
                  <ChevronRight size={22} aria-hidden />
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
