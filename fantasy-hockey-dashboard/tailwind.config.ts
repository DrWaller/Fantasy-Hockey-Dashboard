import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // "The Dark Seider" team palette — void black, visor red, helmet
        // steel, and a warning-amber secondary accent for the HUD/targeting-
        // computer read-out feel.
        rink: {
          ice: "#E9E7E4", // primary text — warm off-white, worn-armor tone
          board: "#0B0B0C", // near-black void background
          steel: "#53565C", // helmet-grey borders and secondary text
          line: "#C8102E", // visor red — primary accent, matches the logo
          ember: "#7A0F1F", // darker red for hover/pressed states
          ash: "#1B1A1C", // panel fill, one step up from the void
          gold: "#D98E2B", // warning-amber — secondary highlight/HUD accent
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
