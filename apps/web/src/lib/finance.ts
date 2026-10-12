export interface FinancingInput {
  amount: number;          // principal, YER
  months: number;          // term
  annualRatePct: number;   // indicative murabaha profit rate per year
}

export interface FinancingResult {
  monthlyInstalment: number;
  principal: number;
  totalProfit: number;
  totalPayable: number;
}

/**
 * Murabaha (flat) estimate: profit = principal × annual rate × years.
 * Pure function — shared by the calculator UI and unit tests.
 */
export function estimateMurabaha({ amount, months, annualRatePct }: FinancingInput): FinancingResult {
  const principal = Math.max(0, amount);
  const term = Math.max(1, Math.round(months));
  const rate = Math.max(0, annualRatePct) / 100;
  const totalProfit = Math.round(principal * rate * (term / 12));
  const totalPayable = principal + totalProfit;
  return { principal, totalProfit, totalPayable, monthlyInstalment: Math.ceil(totalPayable / term) };
}
