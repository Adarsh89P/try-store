export function formatPrice(amount: number | null): string {
  if (amount === null) return "₹[PRICE]";
  return `₹${amount.toLocaleString("en-IN")}`;
}
