/**
 * Format a number as Kenyan Shillings (KES)
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "KES 1,234.50")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-KE").format(num);
}
