import Link from "next/link";

export default function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold text-lagoon">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <rect x="8" y="3" width="18" height="21" rx="3" fill="#D8C9A8" transform="rotate(10 17 13.5)" />
        <rect x="4" y="5" width="18" height="21" rx="3" fill="#0E6E6E" transform="rotate(-6 13 15.5)" />
        <rect x="6.5" y="7.5" width="13" height="12" rx="1.5" fill="#F7F9F8" transform="rotate(-6 13 15.5)" />
        <circle cx="15.5" cy="11.5" r="2" fill="#E3B9A0" transform="rotate(-6 13 15.5)" />
      </svg>
      Keepsake
    </Link>
  );
}
