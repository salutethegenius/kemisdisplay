import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          deep: "#0d0806",
          warm: "#1a1410",
          sidebar: "#0a0604",
          bar: "#140f0a",
          amber: "#ffaa00",
          "amber-bright": "#ffc233",
          violet: "#7b61ff",
          cream: "#fff6e8",
          text: "#c8cedf",
          muted: "#6b7280",
          signal: "#ff3d71",
        },
      },
      fontFamily: {
        sans: ["var(--font-instrument)", "system-ui", "sans-serif"],
        display: ["var(--font-unbounded)", "system-ui", "sans-serif"],
        heading: ["var(--font-lexend)", "var(--font-instrument)", "sans-serif"],
        mono: ["var(--font-space-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
