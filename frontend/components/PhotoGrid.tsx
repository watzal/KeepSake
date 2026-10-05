"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Photo } from "@/lib/api";
import Lightbox from "@/components/Lightbox";

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-5">
        {photos.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setOpen(i)}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            aria-label={`Open photo from ${p.contributor}`}
            className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl bg-mist/40 ring-1 ring-ink/5 transition-shadow hover:shadow-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.thumb_url}
              alt={p.filename}
              loading="lazy"
              className="w-full transition-transform duration-500 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2 pt-8 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {p.contributor}
            </span>
          </motion.button>
        ))}
      </div>
      <Lightbox photos={photos} index={open} onChange={setOpen} />
    </>
  );
}
