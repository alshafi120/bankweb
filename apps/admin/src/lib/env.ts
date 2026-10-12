/** The only build-time value the client sees. API_ORIGIN stays on the server (next.config.ts rewrite). */
export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
