// Payment-related types

export type PaymentStatus = 
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentProvider = "mpesa" | "cash" | "bank_transfer" | "credit";

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentProvider;
  payment_status: PaymentStatus;
  transaction_id?: string; // M-Pesa transaction ID
  phone_number?: string; // For M-Pesa
  initiated_by?: string; // User ID who initiated payment
  initiated_from?: "admin" | "driver" | "customer"; // Where payment was initiated
  mpesa_request_id?: string; // M-Pesa CheckoutRequestID
  mpesa_receipt_number?: string; // M-Pesa receipt number
  failure_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  order_id: string;
  payment_id: string;
  receipt_number: string; // Auto-generated unique number
  issued_to: string; // Customer name
  issued_by?: string; // User ID who issued receipt
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  total: number;
  payment_method: PaymentProvider;
  created_at: string;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface MpesaSTKPushRequest {
  phone_number: string; // Format: 254712345678
  amount: number;
  order_id: string;
  account_reference: string; // Order number or customer name
  transaction_desc: string;
}

export interface MpesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallbackResponse {
  ResultCode: number;
  ResultDesc: string;
  MpesaReceiptNumber?: string;
  TransactionDate?: string;
  PhoneNumber?: string;
}
