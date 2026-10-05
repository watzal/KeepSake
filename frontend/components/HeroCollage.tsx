"use client";

import { motion } from "framer-motion";

// A contact sheet: each frame is a small drawing of the kind of moment the app will find.
function Scene({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 80 100" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
      {children}
    </svg>
  );
}

const Beach = () => (
  <Scene>
    <rect width="80" height="100" fill="#BFE0DC" />
    <circle cx="60" cy="20" r="8" fill="#F8E7B9" />
    <rect y="46" width="80" height="22" fill="#5FAFA8" />
    <path d="M0 53 Q10 50 20 53 T40 53 T60 53 T80 53" stroke="#BFE0DC" strokeWidth="1" fill="none" opacity="0.7" />
    <path d="M0 62 Q20 56 40 62 T80 60 V100 H0Z" fill="#EAD9B5" />
    <path d="M0 66 Q20 60 40 66 T80 64" stroke="#F7F1E3" strokeWidth="1.5" fill="none" />
    <line x1="27" y1="56" x2="24" y2="88" stroke="#8A6F4E" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 60 Q27 34 45 60Z" fill="#E08A6D" />
    <path d="M21 60 Q27 42 27 41 Q27 42 33 60Z" fill="#F7F1E3" />
    <rect x="42" y="80" width="20" height="7" rx="1" fill="#0E6E6E" transform="rotate(-8 52 83)" />
    <rect x="47" y="79.4" width="3" height="7" fill="#F7F1E3" transform="rotate(-8 52 83)" />
  </Scene>
);

const Dinner = () => (
  <Scene>
    <rect width="80" height="100" fill="#D9B38C" />
    <path d="M0 25 H80 M0 50 H80 M0 75 H80 M20 0 V100 M40 0 V100 M60 0 V100" stroke="#CFA57C" strokeWidth="1" />
    <circle cx="26" cy="30" r="15" fill="#FBF7EE" />
    <circle cx="26" cy="30" r="10" fill="#E08A6D" />
    <circle cx="23" cy="28" r="2" fill="#F8E7B9" />
    <circle cx="29" cy="33" r="1.6" fill="#8DB580" />
    <circle cx="56" cy="58" r="15" fill="#FBF7EE" />
    <circle cx="56" cy="58" r="10" fill="#8DB580" />
    <circle cx="53" cy="55" r="2.2" fill="#D9614C" />
    <circle cx="59" cy="61" r="2" fill="#F8E7B9" />
    <circle cx="24" cy="80" r="12" fill="#FBF7EE" />
    <circle cx="24" cy="80" r="8" fill="#E9C46A" />
    <circle cx="60" cy="24" r="6" fill="#F7F1E3" opacity="0.9" />
    <circle cx="60" cy="24" r="4" fill="#B5545C" />
    <circle cx="50" cy="86" r="5" fill="#F7F1E3" opacity="0.9" />
    <circle cx="50" cy="86" r="3.2" fill="#B5545C" />
    <line x1="46" y1="20" x2="46" y2="40" stroke="#8A6F4E" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="36" y1="48" x2="36" y2="68" stroke="#8A6F4E" strokeWidth="1.4" strokeLinecap="round" />
  </Scene>
);

const Sunset = () => (
  <Scene>
    <defs>
      <linearGradient id="hc-sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E88F73" />
        <stop offset="1" stopColor="#F8D7A4" />
      </linearGradient>
    </defs>
    <rect width="80" height="100" fill="url(#hc-sunset)" />
    <circle cx="40" cy="60" r="17" fill="#FCEFC4" />
    <rect y="60" width="80" height="40" fill="#557790" />
    <rect x="28" y="65" width="24" height="2.4" rx="1.2" fill="#FCEFC4" opacity="0.85" />
    <rect x="31" y="72" width="18" height="2.4" rx="1.2" fill="#FCEFC4" opacity="0.65" />
    <rect x="34" y="79" width="12" height="2.4" rx="1.2" fill="#FCEFC4" opacity="0.45" />
    <path d="M0 60 Q8 52 18 60Z" fill="#2F4250" />
    <path d="M8 56 Q9 44 14 38" stroke="#2F4250" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <path d="M14 38 Q7 36 4 41 M14 38 Q20 35 24 40 M14 38 Q12 31 7 31 M14 38 Q19 31 23 33" stroke="#2F4250" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <path d="M56 22 q3 -3 6 0 q3 -3 6 0" stroke="#7A4B3A" strokeWidth="1" fill="none" strokeLinecap="round" />
    <path d="M48 30 q2 -2 4 0 q2 -2 4 0" stroke="#7A4B3A" strokeWidth="1" fill="none" strokeLinecap="round" />
  </Scene>
);

const Fort = () => (
  <Scene>
    <rect width="80" height="100" fill="#CFE1DD" />
    <ellipse cx="18" cy="18" rx="10" ry="4" fill="#F7F9F8" />
    <ellipse cx="26" cy="21" rx="9" ry="3.5" fill="#F7F9F8" />
    <ellipse cx="62" cy="30" rx="8" ry="3" fill="#F7F9F8" />
    <path d="M0 70 Q40 52 80 68 V100 H0Z" fill="#9DB28A" />
    <rect x="10" y="46" width="60" height="28" fill="#D9B58C" />
    <path d="M10 46 v-5 h6 v5 h5 v-5 h6 v5 h5 v-5 h6 v5 h5 v-5 h6 v5 h5 v-5 h6 v5 h5 v-5 h5 v5Z" fill="#D9B58C" />
    <rect x="50" y="26" width="16" height="48" fill="#C9A277" />
    <path d="M50 26 v-5 h4 v5 h2 v-5 h4 v5 h2 v-5 h4 v5Z" fill="#C9A277" />
    <line x1="58" y1="21" x2="58" y2="9" stroke="#7A4B3A" strokeWidth="1" />
    <path d="M58 9 l9 3 l-9 3Z" fill="#0E6E6E" />
    <path d="M26 74 v-12 a6 6 0 0 1 12 0 v12Z" fill="#7A4B3A" />
    <rect x="56" y="36" width="4" height="7" rx="2" fill="#7A4B3A" />
    <rect x="16" y="54" width="3" height="5" rx="1.5" fill="#B98A5E" />
    <rect x="43" y="54" width="3" height="5" rx="1.5" fill="#B98A5E" />
    <path d="M0 78 Q40 66 80 78 V100 H0Z" fill="#84A074" />
  </Scene>
);

const NightOut = () => (
  <Scene>
    <defs>
      <linearGradient id="hc-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1C2B3A" />
        <stop offset="1" stopColor="#3E546B" />
      </linearGradient>
    </defs>
    <rect width="80" height="100" fill="url(#hc-night)" />
    <circle cx="62" cy="16" r="6" fill="#F8E7B9" />
    <circle cx="14" cy="12" r="0.8" fill="#F7F9F8" />
    <circle cx="30" cy="22" r="0.8" fill="#F7F9F8" />
    <circle cx="44" cy="9" r="0.8" fill="#F7F9F8" />
    <circle cx="72" cy="34" r="0.8" fill="#F7F9F8" />
    <path d="M0 100 V62 h12 v-14 h14 v22 h8 V44 h16 v30 h8 V56 h14 v10 h8 V100Z" fill="#131E29" />
    <g fill="#F2C879">
      <rect x="15" y="52" width="3" height="3" />
      <rect x="21" y="58" width="3" height="3" />
      <rect x="37" y="48" width="3" height="3" />
      <rect x="44" y="48" width="3" height="3" />
      <rect x="37" y="56" width="3" height="3" />
      <rect x="44" y="64" width="3" height="3" />
      <rect x="61" y="60" width="3" height="3" />
      <rect x="67" y="68" width="3" height="3" />
      <rect x="4" y="68" width="3" height="3" />
    </g>
    <path d="M0 80 Q20 92 40 82 T80 80" stroke="#F7F1E3" strokeWidth="0.8" fill="none" opacity="0.8" />
    <circle cx="10" cy="84.5" r="2.4" fill="#E08A6D" />
    <circle cx="24" cy="87.5" r="2.4" fill="#F2C879" />
    <circle cx="40" cy="84" r="2.4" fill="#3FA7A0" />
    <circle cx="56" cy="80.5" r="2.4" fill="#E08A6D" />
    <circle cx="70" cy="80.5" r="2.4" fill="#F2C879" />
  </Scene>
);

const Travel = () => (
  <Scene>
    <rect width="80" height="100" fill="#D4E6EA" />
    <circle cx="16" cy="18" r="6" fill="#F8E7B9" />
    <path d="M-6 62 L20 26 L46 62Z" fill="#8FA9B5" />
    <path d="M20 26 L13 36 L18 34 L21 38 L25 33 L28 37Z" fill="#F7F9F8" />
    <path d="M26 62 L56 18 L90 62Z" fill="#6F8D9C" />
    <path d="M56 18 L48 30 L53 28 L57 33 L61 27 L65 31Z" fill="#F7F9F8" />
    <rect y="60" width="80" height="40" fill="#A9C3A0" />
    <path d="M0 74 Q40 62 80 74 V100 H0Z" fill="#94B28B" />
    <path d="M28 100 Q44 80 40 70 Q38 64 46 60 L50 60 Q44 65 47 71 Q53 82 54 100Z" fill="#4B5F6B" />
    <path d="M41 98 Q46 84 44 74" stroke="#F8E7B9" strokeWidth="1.2" strokeDasharray="4 4" fill="none" />
    <path d="M8 66 l4 -9 l4 9Z M64 70 l4 -10 l4 10Z" fill="#3F7D6E" />
  </Scene>
);

const Friends = () => (
  <Scene>
    <rect width="80" height="100" fill="#F3DFC0" />
    <circle cx="40" cy="46" r="34" fill="#F8EBD2" />
    <path d="M0 84 Q40 74 80 84 V100 H0Z" fill="#E3C99C" />
    <rect x="6" y="56" width="26" height="50" rx="12" fill="#0E6E6E" />
    <circle cx="19" cy="44" r="10" fill="#C68F6B" />
    <path d="M9 43 a10 10 0 0 1 20 -1 q-9 1 -12 -5 q-2 5 -8 6Z" fill="#2F2420" />
    <rect x="48" y="58" width="26" height="50" rx="12" fill="#E3B04B" />
    <circle cx="61" cy="46" r="10" fill="#8D5B3F" />
    <path d="M51 46 a10 10 0 0 1 20 0 q-10 -2 -20 0Z" fill="#1F1714" />
    <rect x="26" y="50" width="28" height="56" rx="13" fill="#E08A6D" />
    <circle cx="40" cy="36" r="11" fill="#EBC4A0" />
    <path d="M29 37 a11 11 0 0 1 22 0 v8 q-3 -8 -5 -10 q-7 2 -14 0 q-2 4 -3 10Z" fill="#6B4630" />
    <path d="M36 39 q4 4 8 0" stroke="#7A4B3A" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    <path d="M16 46 q3 3 6 0 M58 48 q3 3 6 0" stroke="#3A2A22" strokeWidth="1" fill="none" strokeLinecap="round" />
  </Scene>
);

const Market = () => (
  <Scene>
    <rect width="80" height="100" fill="#F1E3C6" />
    <rect y="78" width="80" height="22" fill="#D8C9A8" />
    <rect x="8" y="30" width="2.5" height="52" fill="#8A6F4E" />
    <rect x="69.5" y="30" width="2.5" height="52" fill="#8A6F4E" />
    <g>
      <rect x="4" y="16" width="72" height="14" fill="#F7F1E3" />
      <path d="M4 16 h12 v14 h-12Z M28 16 h12 v14 h-12Z M52 16 h12 v14 h-12Z" fill="#D9614C" />
      <path d="M4 30 a6 6 0 0 0 12 0Z M28 30 a6 6 0 0 0 12 0Z M52 30 a6 6 0 0 0 12 0Z" fill="#D9614C" />
      <path d="M16 30 a6 6 0 0 0 12 0Z M40 30 a6 6 0 0 0 12 0Z M64 30 a6 6 0 0 0 12 0Z" fill="#F7F1E3" />
    </g>
    <rect x="12" y="62" width="56" height="20" fill="#B98A5E" />
    <rect x="12" y="62" width="56" height="3" fill="#A07449" />
    <path d="M14 62 l3 -12 h14 l3 12Z" fill="#C9A277" />
    <path d="M36 62 l3 -12 h14 l3 12Z" fill="#C9A277" />
    <g fill="#E9963E">
      <circle cx="20" cy="50" r="3.2" />
      <circle cx="26" cy="50" r="3.2" />
      <circle cx="23" cy="45" r="3.2" />
    </g>
    <g fill="#8DB580">
      <circle cx="42" cy="50" r="3.2" />
      <circle cx="48" cy="50" r="3.2" />
      <circle cx="45" cy="45" r="3.2" />
    </g>
    <g fill="#D9614C">
      <circle cx="60" cy="58" r="3" />
      <circle cx="65" cy="59" r="3" />
    </g>
    <line x1="40" y1="30" x2="40" y2="37" stroke="#8A6F4E" strokeWidth="0.8" />
    <rect x="37.5" y="37" width="5" height="6" rx="2" fill="#E3B04B" />
  </Scene>
);

const Stay = () => (
  <Scene>
    <defs>
      <linearGradient id="hc-stay" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9FC0C4" />
        <stop offset="1" stopColor="#F2CFAE" />
      </linearGradient>
    </defs>
    <rect width="80" height="100" fill="url(#hc-stay)" />
    <circle cx="64" cy="18" r="5" fill="#FCEFC4" />
    <path d="M0 66 Q40 54 80 66 V100 H0Z" fill="#7FA58F" />
    <path d="M6 70 l8 -26 l8 26Z M58 70 l9 -30 l9 30Z" fill="#3F7D6E" />
    <path d="M-2 72 l7 -20 l7 20Z M68 74 l8 -22 l8 22Z" fill="#2F6659" />
    <rect x="22" y="52" width="36" height="26" fill="#C98F62" />
    <path d="M18 54 L40 34 L62 54Z" fill="#7A4B3A" />
    <rect x="46" y="36" width="5" height="10" fill="#7A4B3A" />
    <rect x="36" y="62" width="9" height="16" rx="1" fill="#5A3A2E" />
    <rect x="26" y="58" width="7" height="7" fill="#FCEFC4" />
    <rect x="48" y="58" width="7" height="7" fill="#FCEFC4" />
    <path d="M29.5 58 v7 M26 61.5 h7 M51.5 58 v7 M48 61.5 h7" stroke="#C98F62" strokeWidth="0.8" />
    <path d="M36 78 Q34 90 28 100 H52 Q46 90 45 78Z" fill="#E3C99C" />
    <path d="M0 84 Q40 76 80 84 V100 H0Z" fill="#6E9881" opacity="0.5" />
  </Scene>
);

const FRAMES = [
  { label: "Beach", art: Beach, tilt: -3, tape: true },
  { label: "Dinner", art: Dinner, tilt: 2 },
  { label: "Sunset", art: Sunset, tilt: -1.5, tape: true },
  { label: "Fort", art: Fort, tilt: 2.5 },
  { label: "Night out", art: NightOut, tilt: -2, tape: true },
  { label: "Road trip", art: Travel, tilt: 3 },
  { label: "Friends", art: Friends, tilt: -2.5, tape: true },
  { label: "Market", art: Market, tilt: 1.5 },
  { label: "The stay", art: Stay, tilt: -1 },
];

export default function HeroCollage() {
  return (
    <section aria-hidden="true" className="grid grid-cols-3 gap-4 pb-8 sm:gap-6">
      {FRAMES.map(({ label, art: Art, tilt, tape }, i) => (
        // the middle column sits lower so the sheet reads as pinned up by hand, not laid out on a grid
        <div key={label} className={i % 3 === 1 ? "translate-y-8" : ""}>
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: tilt, transition: { delay: 0.15 + i * 0.05 } }}
            whileHover={{ rotate: 0, scale: 1.06, y: -6, zIndex: 10 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="relative rounded-[3px] bg-white p-2 pb-1 shadow-print ring-1 ring-ink/5"
          >
            {tape && (
              <span className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-3 bg-sand/70 shadow-sm backdrop-blur-[1px]" />
            )}
            <div className="aspect-[4/5] overflow-hidden rounded-[2px] ring-1 ring-inset ring-ink/5">
              <Art />
            </div>
            <p className="py-1.5 text-center font-hand text-lg leading-none text-ink/70 sm:text-xl">{label}</p>
          </motion.div>
        </div>
      ))}
    </section>
  );
}
