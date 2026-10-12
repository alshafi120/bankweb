/** Password policy from docs/API.md: ≥ 12 chars, upper, lower, digit, symbol. (Breach check happens server-side.) */
export const POLICY = [
  { key: "length", test: (p: string) => p.length >= 12 },
  { key: "upper", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", test: (p: string) => /[a-z]/.test(p) },
  { key: "digit", test: (p: string) => /\d/.test(p) },
  { key: "symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export type PolicyKey = (typeof POLICY)[number]["key"];

export function passwordScore(p: string): 0 | 1 | 2 | 3 | 4 {
  if (!p) return 0;
  const passed = POLICY.filter((r) => r.test(p)).length;
  let s = passed >= 5 ? 3 : passed >= 4 ? 2 : passed >= 2 ? 1 : 0;
  if (passed === 5 && p.length >= 16 && new Set(p).size >= 10) s = 4;
  if (/(.)\1{3,}/.test(p) || /^(password|123456|qwerty)/i.test(p)) s = Math.min(s, 1);
  return s as 0 | 1 | 2 | 3 | 4;
}

export const meetsPolicy = (p: string) => POLICY.every((r) => r.test(p));
