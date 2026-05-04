import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      colors: {
        ink: "#141414",
        concrete: "#F1F5F9",
        "tech-blue": "#3B82F6",
      },
      boxShadow: {
        "ink": "0 25px 50px -12px rgba(20,20,20,0.25)",
        "blue-glow": "0 10px 40px -10px rgba(59,130,246,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
