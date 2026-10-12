import type { Config } from "tailwindcss";

/** Every color maps to a CSS variable defined in globals.css (light + dark). */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  // Dark follows the OS unless the user picked a theme explicitly (data-theme on <html>).
  darkMode: ["variant", ["@media (prefers-color-scheme: dark) { &:not([data-theme=light] *) }", "&:is([data-theme=dark] *)"]],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem", lg: "2rem" }, screens: { "2xl": "1240px" } },
    screens: { xs: "390px", sm: "640px", md: "768px", lg: "1024px", xl: "1440px", "2xl": "1920px" },
    extend: {
      colors: {
        brand: { 900: token("brand-900"), 700: token("brand-700"), 100: token("brand-100") },
        accent: token("accent"),
        secondary: token("secondary"),
        bg: token("bg"),
        surface: token("surface"),
        ink: token("text"),
        muted: token("muted"),
        line: token("border"),
        success: token("success"),
        warning: token("warning"),
        danger: token("error"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { card: "12px", arch: "999px 999px 16px 16px" },
      boxShadow: {
        lift: "0 1px 2px rgb(12 58 54 / .06), 0 8px 24px -12px rgb(12 58 54 / .18)",
      },
      transitionTimingFunction: { bank: "cubic-bezier(.2,.7,.2,1)" },
    },
  },
  plugins: [],
} satisfies Config;
