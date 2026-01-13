/**
 * SMS Types for HarakaPOS
 * Type definitions for SMS integration with TalkSasa/Ladybird API
 */

// SMS sending result
export interface SMSResult {
  success: boolean;
  taskId?: string;
  error?: string;
}

// SMS registration result
export interface SMSRegistrationResult {
  success: boolean;
  proxyApiKey?: string;
  error?: string;
}

// SMS message statistics
export interface SMSMessageStats {
  length: number;
  smsCount: number;
  isValid: boolean;
}

// SMS event types for automated notifications
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

// SMS delivery status from webhook
export type SMSDeliveryStatus = 
  | 'Pending'
  | 'Sent'
  | 'Delivered'
  | 'Failed'
  | 'Rejected';

// SMS log entry for database
export interface SMSLogEntry {
  id?: string;
  order_id?: string;
  phone: string;
  message: string;
  event_type?: SMSEventType;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  task_id?: string;
  error?: string;
  delivery_status?: SMSDeliveryStatus;
  delivered_at?: string;
  created_at?: string;
}

// SMS configuration status
export interface SMSConfigStatus {
  isConfigured: boolean;
  hasProxyKey: boolean;
  hasSenderId: boolean;
  senderId?: string;
}

// Order details for SMS templates
export interface SMSOrderDetails {
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

// Payment details for SMS templates
export interface SMSPaymentDetails {
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}

// Bulk SMS result
export interface BulkSMSResult {
  successful: number;
  failed: number;
  results: SMSResult[];
}

// TalkSasa API request payload
export interface TalkSasaSendPayload {
  recipient: string;
  sender_id: string;
  type: 'plain';
  message: string;
}

// TalkSasa API response
export interface TalkSasaSendResponse {
  status: 'success' | 'error';
  task_id?: string;
  message?: string;
}

// TalkSasa registration payload
export interface TalkSasaRegisterPayload {
  email: string;
  name: string;
  talksasa_api_key: string;
}

// TalkSasa registration response
export interface TalkSasaRegisterResponse {
  id: number;
  email: string;
  proxy_api_key: string;
  message: string;
}

// Webhook delivery callback parameters
export interface SMSWebhookParams {
  username: string;
  action: 'delivery';
  destination: string;
  status: SMSDeliveryStatus;
  message: string;
  reseller_id: string;
}
