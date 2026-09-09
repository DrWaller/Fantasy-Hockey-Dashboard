import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rink: {
          ice: "#EDF3F5", // faint ice-white
          board: "#0E1B23", // rink boards, deep blue-black
          steel: "#3A4B57", // skate-steel grey-blue
          line: "#C8102E", // centre-ice red, used as the single accent
          gold: "#F2A900", // faceoff-dot amber, secondary accent for VOR highlight
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
