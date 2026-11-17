const PLACEHOLDER = "₹[PRICE]";

/** Formats a rupee amount. `null` (price not set yet) renders as a visible placeholder. */
export function formatPrice(amount: number | null): string {
  if (amount === null) return PLACEHOLDER;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Sums prices; returns `null` while any price is still unset. */
export function sumPrices(values: (number | null)[]): number | null {
  let total = 0;
  for (const v of values) {
    if (v === null) return null;
    total += v;
  }
  return total;
}
