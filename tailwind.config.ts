import type { Config } from "tailwindcss";

// Palette du cahier de conception : indigo (structure) + ambre (accent A★),
// statuts de maîtrise vert / ambre / rouge.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F4FA",
        ink: "#191830",
        muted: "#565578",
        faint: "#8886a6",
        line: "#E1E0EF",
        indigo: { DEFAULT: "#4F46E5", deep: "#2A2472", soft: "#ECEBFB" },
        amber: { DEFAULT: "#C97E10", bright: "#EBA92C", soft: "#FBF0DA" },
        mastered: { DEFAULT: "#1f9d6b", bg: "#E4F4EC" },
        learning: { DEFAULT: "#c8891a", bg: "#F8EFDB" },
        gap: { DEFAULT: "#d85440", bg: "#F9E6E1" },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Public Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 10px 30px -22px rgba(42,36,114,.5)",
        hero: "0 26px 64px -46px rgba(42,36,114,.55)",
      },
    },
  },
  plugins: [],
};
export default config;
