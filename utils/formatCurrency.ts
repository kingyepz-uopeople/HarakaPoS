/**
 * Format a number as Kenyan Shillings (KES)
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "Ksh 1,234.50")
 */
export function formatCurrency(amount: number): string {
  // Use manual formatting to avoid hydration mismatches between server and client
  // Intl.NumberFormat can produce different results based on locale data availability
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Ksh ${formatted}`;
}

/**
 * Format a number with commas
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-KE").format(num);
}
