import type { Config } from "tailwindcss";

// Palette du cahier de conception : indigo (structure) + ambre (accent A★),
// statuts de maîtrise vert / ambre / rouge.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // CODE COULEUR COACH EMMA : émeraude + or + crème (Fraunces).
      // Les noms de classes (indigo/amber) sont conservés — seules les valeurs
      // basculent sur la palette Emma, ce qui re-skinne tout le produit d'un coup.
      colors: {
        paper: "#FAF8F3",
        ink: "#2b2a26",
        muted: "#5b574e",
        faint: "#9a948a",
        line: "#ece7db",
        indigo: { DEFAULT: "#064E3B", deep: "#053f30", soft: "#eef6f0" },
        amber: { DEFAULT: "#9a8f2e", bright: "#FACC15", soft: "#FEF9C3" },
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
        card: "0 18px 44px -30px rgba(6,78,59,.24)",
        hero: "0 26px 58px -40px rgba(6,78,59,.5)",
      },
    },
  },
  plugins: [],
};
export default config;
