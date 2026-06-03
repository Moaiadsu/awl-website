import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#040e1c",
          800: "#0A1628",
          700: "#0D2040",
          600: "#1E3A5F",
          500: "#2D4E78",
        },
        sky: {
          600: "#0284C7",
          500: "#0EA5E9",
          400: "#38BDF8",
          100: "#E0F2FE",
          50:  "#F0F9FF",
        },
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
