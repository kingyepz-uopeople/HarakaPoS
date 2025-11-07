/**
 * Generate public tracking URL for an order
 */
export function generateTrackingUrl(orderId: string): string {
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    return `${baseUrl}/track/${orderId}`;
  }
  // Fallback for server-side rendering
  return `/track/${orderId}`;
}

/**
 * Copy tracking URL to clipboard
 */
export async function copyTrackingUrl(orderId: string): Promise<boolean> {
  try {
    const url = generateTrackingUrl(orderId);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy tracking URL:', error);
    return false;
  }
}

/**
 * Share tracking URL via Web Share API (mobile)
 */
export async function shareTrackingUrl(orderId: string, customerName?: string): Promise<boolean> {
  try {
    const url = generateTrackingUrl(orderId);
    const text = customerName 
      ? `Track your delivery, ${customerName}! ${url}`
      : `Track your delivery: ${url}`;
    
    if (navigator.share) {
      await navigator.share({
        title: 'Track Your Delivery',
        text,
        url,
      });
      return true;
    } else {
      // Fallback to clipboard
      return await copyTrackingUrl(orderId);
    }
  } catch (error) {
    console.error('Failed to share tracking URL:', error);
    return false;
  }
}
