import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tide: "#E9EFEE",
        ink: "#17262B",
        lagoon: { DEFAULT: "#0E6E6E", dark: "#0A5555", light: "#3FA7A0" },
        shell: "#F7F9F8",
        sand: "#D8C9A8",
        mist: "#B9C8C6",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 38, 43, 0.04), 0 12px 32px -16px rgba(23, 38, 43, 0.18)",
        lift: "0 10px 24px -12px rgba(14, 110, 110, 0.55)",
        print: "0 1px 2px rgba(23, 38, 43, 0.08), 0 16px 28px -18px rgba(23, 38, 43, 0.35)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        slide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(350%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        slide: "slide 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
