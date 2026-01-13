/**
 * SMS Message Templates for HarakaPOS
 * 
 * These templates are used for automated delivery notifications.
 * Keep messages under 160 characters when possible to avoid splitting.
 */

interface OrderDetails {
  orderId: string;
  customerName: string;
  quantity: number;
  totalAmount: number;
  deliveryDate?: string;
  deliveryTime?: string;
  trackingUrl?: string;
  driverName?: string;
  driverPhone?: string;
  eta?: string;
}

interface PaymentDetails {
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}

/**
 * Format currency for Kenya (KES)
 */
function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

/**
 * Truncate customer name if too long
 */
function shortName(name: string): string {
  if (name.length > 15) {
    return name.split(' ')[0]; // Use first name only
  }
  return name;
}

// ============================================
// ORDER LIFECYCLE SMS TEMPLATES
// ============================================

/**
 * Sent when order is confirmed/created
 * ~140 chars
 */
export function orderConfirmedSMS(order: OrderDetails): string {
  const dateStr = order.deliveryDate 
    ? ` for ${order.deliveryDate}` 
    : '';
  
  return `Hi ${shortName(order.customerName)}, your order #${order.orderId.slice(-6)} for ${order.quantity}kg (${formatCurrency(order.totalAmount)}) is confirmed${dateStr}. Thank you! - HarakaPOS`;
}

/**
 * Sent when driver is assigned and order is scheduled
 * ~150 chars
 */
export function orderScheduledSMS(order: OrderDetails): string {
  return `Hi ${shortName(order.customerName)}, your order #${order.orderId.slice(-6)} is scheduled for delivery on ${order.deliveryDate || 'today'}. We'll notify you when the driver is on the way. - HarakaPOS`;
}

/**
 * Sent when driver starts delivery (Out for Delivery status)
 * ~155 chars with tracking link
 */
export function outForDeliverySMS(order: OrderDetails): string {
  let msg = `Hi ${shortName(order.customerName)}, your order is out for delivery!`;
  
  if (order.driverName) {
    msg += ` Driver: ${order.driverName}`;
    if (order.driverPhone) {
      msg += ` (${order.driverPhone})`;
    }
  }
  
  if (order.eta) {
    msg += `. ETA: ${order.eta}`;
  }
  
  // Add tracking URL if available and there's room
  if (order.trackingUrl && msg.length < 120) {
    msg += `. Track: ${order.trackingUrl}`;
  }
  
  msg += ' - HarakaPOS';
  
  return msg;
}

/**
 * Sent when driver is arriving (within geofence)
 * ~100 chars - short and urgent
 */
export function driverArrivingSMS(order: OrderDetails): string {
  let msg = `Your HarakaPOS delivery is arriving now!`;
  
  if (order.driverName) {
    msg += ` Driver: ${order.driverName}`;
  }
  
  msg += ` Please be ready to receive your ${order.quantity}kg order.`;
  
  return msg;
}

/**
 * Sent when order is delivered
 * ~130 chars
 */
export function orderDeliveredSMS(order: OrderDetails): string {
  return `Hi ${shortName(order.customerName)}, your order #${order.orderId.slice(-6)} (${order.quantity}kg) has been delivered! Total: ${formatCurrency(order.totalAmount)}. Thank you for choosing HarakaPOS!`;
}

/**
 * Sent when order is cancelled
 * ~120 chars
 */
export function orderCancelledSMS(order: OrderDetails): string {
  return `Hi ${shortName(order.customerName)}, your order #${order.orderId.slice(-6)} has been cancelled. For questions, please contact us. - HarakaPOS`;
}

// ============================================
// PAYMENT SMS TEMPLATES
// ============================================

/**
 * Sent when payment is received
 * ~140 chars
 */
export function paymentReceivedSMS(payment: PaymentDetails): string {
  let msg = `Payment of ${formatCurrency(payment.amount)} received for order #${payment.orderId.slice(-6)}`;
  
  if (payment.transactionId) {
    msg += `. Ref: ${payment.transactionId}`;
  }
  
  msg += `. Thank you! - HarakaPOS`;
  
  return msg;
}

/**
 * Sent as payment reminder (for unpaid COD orders)
 * ~145 chars
 */
export function paymentReminderSMS(order: OrderDetails): string {
  return `Hi ${shortName(order.customerName)}, reminder: ${formatCurrency(order.totalAmount)} is due for your order #${order.orderId.slice(-6)}. Please have cash ready for delivery. - HarakaPOS`;
}

/**
 * M-Pesa payment request sent
 * ~140 chars
 */
export function mpesaRequestSentSMS(order: OrderDetails): string {
  return `Hi ${shortName(order.customerName)}, an M-Pesa payment request of ${formatCurrency(order.totalAmount)} has been sent to your phone. Please enter your PIN to complete. - HarakaPOS`;
}

// ============================================
// PROMOTIONAL/OTHER TEMPLATES
// ============================================

/**
 * Welcome SMS for new customers
 * ~140 chars
 */
export function welcomeCustomerSMS(customerName: string): string {
  return `Welcome to HarakaPOS, ${shortName(customerName)}! We deliver fresh products right to your door. Contact us anytime to place your order. - HarakaPOS`;
}

/**
 * Custom/promotional message
 * Ensure message stays under 160 chars
 */
export function customSMS(message: string, maxLength: number = 160): string {
  const suffix = ' - HarakaPOS';
  const maxContentLength = maxLength - suffix.length;
  
  if (message.length > maxContentLength) {
    return message.slice(0, maxContentLength - 3) + '...' + suffix;
  }
  
  return message + suffix;
}

// ============================================
// TEMPLATE HELPERS
// ============================================

/**
 * Get character count for a message
 */
export function getMessageStats(message: string): {
  length: number;
  smsCount: number;
  isValid: boolean;
} {
  const length = message.length;
  // Standard SMS is 160 chars, concatenated SMS uses 153 chars per segment
  const smsCount = length <= 160 ? 1 : Math.ceil(length / 153);
  
  return {
    length,
    smsCount,
    isValid: length > 0 && length <= 918 // Max 6 concatenated SMS
  };
}

/**
 * All available SMS event types
 */
export type SMSEventType = 
  | 'order_confirmed'
  | 'order_scheduled'
  | 'out_for_delivery'
  | 'driver_arriving'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_reminder'
  | 'mpesa_request'
  | 'welcome';

/**
 * Get SMS template by event type
 */
export function getSMSByEvent(
  eventType: SMSEventType,
  data: OrderDetails | PaymentDetails | { customerName: string }
): string {
  switch (eventType) {
    case 'order_confirmed':
      return orderConfirmedSMS(data as OrderDetails);
    case 'order_scheduled':
      return orderScheduledSMS(data as OrderDetails);
    case 'out_for_delivery':
      return outForDeliverySMS(data as OrderDetails);
    case 'driver_arriving':
      return driverArrivingSMS(data as OrderDetails);
    case 'order_delivered':
      return orderDeliveredSMS(data as OrderDetails);
    case 'order_cancelled':
      return orderCancelledSMS(data as OrderDetails);
    case 'payment_received':
      return paymentReceivedSMS(data as PaymentDetails);
    case 'payment_reminder':
      return paymentReminderSMS(data as OrderDetails);
    case 'mpesa_request':
      return mpesaRequestSentSMS(data as OrderDetails);
    case 'welcome':
      return welcomeCustomerSMS((data as { customerName: string }).customerName);
    default:
      throw new Error(`Unknown SMS event type: ${eventType}`);
  }
}
