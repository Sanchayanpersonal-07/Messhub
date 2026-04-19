import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: [
    "./**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [tailwindcssAnimate],
} satisfies Config;
