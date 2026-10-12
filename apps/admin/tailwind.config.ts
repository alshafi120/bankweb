import type { Config } from "tailwindcss";

/** Same token set as apps/web (globals.css holds the light + dark values). */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["variant", ["@media (prefers-color-scheme: dark) { &:not([data-theme=light] *) }", "&:is([data-theme=dark] *)"]],
  theme: {
    screens: { xs: "390px", sm: "640px", md: "768px", lg: "1024px", xl: "1440px", "2xl": "1920px" },
    extend: {
      colors: {
        brand: { 900: token("brand-900"), 700: token("brand-700"), 100: token("brand-100") },
        accent: token("accent"),
        secondary: token("secondary"),
        bg: token("bg"),
        surface: token("surface"),
        raised: token("raised"),
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
      fontSize: { "2xs": ["11px", "16px"], xs: ["12px", "18px"], sm: ["13px", "20px"], base: ["14px", "22px"] },
      borderRadius: { card: "12px", arch: "999px 999px 16px 16px" },
      boxShadow: {
        lift: "0 1px 2px rgb(12 58 54 / .06), 0 8px 24px -12px rgb(12 58 54 / .18)",
        pop: "0 12px 40px -8px rgb(8 30 28 / .35)",
      },
      transitionTimingFunction: { bank: "cubic-bezier(.2,.7,.2,1)" },
    },
  },
  plugins: [],
} satisfies Config;
