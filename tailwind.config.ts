import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        muted: "#627184",
        ocean: "#0b7a75",
        amber: "#c47f18"
      }
    }
  },
  plugins: []
};

export default config;
