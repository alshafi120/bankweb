import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateMurabaha } from "./finance.ts";

test("1,000,000 YER over 24 months at 9%", () => {
  const r = estimateMurabaha({ amount: 1_000_000, months: 24, annualRatePct: 9 });
  assert.equal(r.totalProfit, 180_000);
  assert.equal(r.totalPayable, 1_180_000);
  assert.equal(r.monthlyInstalment, 49_167); // ceil(1,180,000 / 24)
});

test("guards against invalid input", () => {
  const r = estimateMurabaha({ amount: -5, months: 0, annualRatePct: -1 });
  assert.deepEqual(r, { principal: 0, totalProfit: 0, totalPayable: 0, monthlyInstalment: 0 });
});
