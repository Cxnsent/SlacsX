import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        surface: "#111827",
        muted: "#1f2937",
        accent: "#38bdf8",
        warning: "#facc15",
        success: "#22c55e"
      }
    }
  },
  plugins: []
};

export default config;
