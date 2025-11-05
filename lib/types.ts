/**
 * Database Types for HarakaPOS
 * These types match the Supabase database schema
 */

export type UserRole = "admin" | "driver";

export type PaymentMethod = "Cash" | "M-Pesa" | "Bank Transfer" | "Credit Card";

export type DeliveryStatus = "Pending" | "On the Way" | "Delivered";

export type OrderStatus = 
  | "Scheduled"        // Order confirmed, driver assigned
  | "Pending"          // Ready for pickup
  | "Out for Delivery" // Driver en route
  | "Delivered"        // At customer location
  | "Completed"        // Payment confirmed, closed
  | "Cancelled";       // Order cancelled

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Stock {
  id: string;
  date: string;
  quantity_kg: number;
  source: string;
  total_cost: number;
  cost_per_kg?: number; // Generated column, optional on insert
  created_at?: string;
}

export interface Sale {
  id: string;
  date: string;
  order_id?: string; // Link to order if sale came from pre-order
  customer_id?: string;
  customer_name?: string; // Kept for backwards compatibility
  customer_phone?: string;
  quantity_sold: number;
  price_per_kg: number;
  total_amount: number;
  amount: number; // Deprecated, kept for backwards compatibility
  payment_method: PaymentMethod;
  driver_id?: string;
  delivery_status: DeliveryStatus;
  delivery_location?: string;
  profit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Delivery {
  id: string;
  sale_id: string;
  driver_id: string;
  customer_name: string;
  customer_phone: string;
  location: string;
  status: DeliveryStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  location?: string;
  kra_pin?: string; // Optional KRA PIN for tax invoices
  created_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  quantity_kg: number;
  price_per_kg: number;
  total_price?: number; // Generated column, optional on insert
  payment_mode: PaymentMethod;
  delivery_status: OrderStatus;
  delivery_date: string; // DATE format: YYYY-MM-DD
  delivery_time?: string; // TIME format: HH:MM:SS
  delivery_notes?: string;
  assigned_driver?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'json';
  description?: string;
  updated_at?: string;
}

// Helper type for parsed settings
export interface AppSettings {
  price_per_kg: number;
  delivery_fee_flat: number;
  payment_modes: string[];
  business_name: string;
  business_phone: string;
  business_address: string;
  currency: string;
  tax_rate?: number;
}

// Extended types with joins for UI
export interface DeliveryWithDetails extends Delivery {
  sale?: Sale;
  driver?: User;
}

export interface SaleWithDelivery extends Sale {
  delivery?: Delivery;
  driver?: User;
  customer?: Customer;
  order?: Order; // Linked order if sale came from pre-order
}

// Dispatch System Types

export interface OrderStatusLog {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string; // user_id
  changed_at: string;
  notes?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface DeliveryProof {
  id: string;
  order_id: string;
  sale_id?: string;
  photo_url?: string;
  signature_url?: string;
  delivered_at: string;
  delivered_by: string; // driver user_id
  customer_notes?: string;
  payment_method: PaymentMethod;
  payment_confirmed: boolean;
}

export interface DriverStatus {
  driver_id: string;
  status: 'available' | 'busy' | 'offline';
  current_location_lat?: number;
  current_location_lng?: number;
  last_updated: string;
}

export interface OrderWithDetails extends Order {
  customer?: Customer;
  driver?: User;
  payments?: Payment[];
}

// Payment System Types

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
  created_at?: string;
  updated_at?: string;
}

export interface Receipt {
  id: string;
  order_id: string;
  payment_id?: string;
  receipt_number: string; // Auto-generated unique number
  issued_to: string; // Customer name
  issued_by?: string; // User ID who issued receipt
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  total: number;
  payment_method: PaymentProvider;
  created_at?: string;
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

// Business Expenses Types
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Expense {
  id: string;
  expense_date: string; // Changed from 'date' to match schema
  amount: number;
  category_id: string;
  category?: ExpenseCategory; // Joined data
  description: string; // Required in schema
  payment_method: 'cash' | 'mpesa' | 'bank_transfer' | 'cheque' | 'credit_card';
  payment_reference?: string; // M-Pesa code, cheque number, etc.
  vendor_name?: string; // Changed from 'supplier'
  vendor_contact?: string;
  receipt_number?: string;
  receipt_image_url?: string; // Changed from 'receipt_url'
  notes?: string;
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recorded_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfitAnalysis {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number; // Percentage
}

// eTIMS (KRA Tax Integration) Types
export interface EtimsConfig {
  id: string;
  business_name: string;
  kra_pin: string;
  business_type: string;
  cu_serial_number?: string;
  cu_model?: string;
  cu_status: 'active' | 'inactive' | 'pending';
  environment: 'sandbox' | 'production';
  api_base_url?: string;
  bhf_id?: string;
  tin?: string;
  device_initialization_date?: string;
  last_invoice_number: number;
  invoice_prefix: string;
  auto_submit: boolean;
  auto_submit_invoices?: boolean; // Alias for auto_submit
  require_internet: boolean;
  print_qr_code: boolean;
  enabled?: boolean; // Whether eTIMS is enabled at all
  default_vat_rate?: number; // Default VAT rate (e.g., 16)
  created_at?: string;
  updated_at?: string;
}

export interface EtimsInvoice {
  id: string;
  invoice_number: string;
  internal_data?: string;
  receipt_number?: string;
  sale_id?: string;
  order_id?: string;
  customer_tin?: string;
  customer_name: string;
  customer_phone?: string;
  invoice_date: string;
  sale_date: string;
  total_before_tax: number;
  vat_amount: number;
  total_after_tax: number;
  vat_rate: number;
  tax_type: 'VAT_EXEMPT' | 'VAT_STANDARD' | 'VAT_ZERO';
  submission_status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'failed';
  submission_date?: string;
  kra_response?: any;
  kra_invoice_number?: string;
  kra_verification_url?: string;
  qr_code_data?: string;
  receipt_signature?: string;
  signature_date?: string;
  error_message?: string;
  retry_count: number;
  last_retry_date?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  items?: EtimsInvoiceItem[]; // Joined data
}

export interface EtimsInvoiceItem {
  id: string;
  invoice_id: string;
  item_sequence: number;
  item_code?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  tax_type: string;
  vat_category?: string;
  vat_rate: number;
  vat_amount: number;
  package_unit: string;
  package_quantity?: number;
  created_at?: string;
}

export interface EtimsSyncLog {
  id: string;
  operation_type: string;
  request_payload?: any;
  request_timestamp: string;
  response_payload?: any;
  response_timestamp?: string;
  response_code?: number;
  status: 'success' | 'failed' | 'timeout';
  error_message?: string;
  invoice_id?: string;
  created_at?: string;
}

export interface EtimsStatistics {
  total_invoices: number;
  approved_invoices: number;
  pending_invoices: number;
  rejected_invoices: number;
  total_revenue: number;
  total_vat_collected: number;
  compliance_rate: number;
}

// Barcode Delivery Tracking Types
export type BarcodeStatus = 
  | 'pending'       // Barcode generated, not yet used
  | 'printed'       // Barcode label printed
  | 'loading'       // Items being loaded to vehicle
  | 'in_transit'    // Driver en route to customer
  | 'delivered'     // Successfully delivered
  | 'failed'        // Delivery failed
  | 'cancelled';    // Delivery cancelled

export type ScanType =
  | 'generate'      // Barcode created
  | 'print'         // Barcode printed
  | 'loading'       // Scanned during loading
  | 'departure'     // Scanned when leaving warehouse
  | 'arrival'       // Scanned on arrival at location
  | 'delivery'      // Scanned on successful delivery
  | 'verification'; // Customer verification scan

export interface DeliveryBarcode {
  id: string;
  barcode: string;
  order_id?: string;
  sale_id?: string;
  
  // Generation info
  generated_at: string;
  generated_by?: string;
  
  // Delivery info
  customer_name: string;
  customer_phone?: string;
  delivery_location?: string;
  quantity_kg: number;
  total_amount: number;
  
  // Status tracking
  status: BarcodeStatus;
  
  // Scan tracking
  first_scan_at?: string;
  first_scanned_by?: string;
  last_scan_at?: string;
  last_scanned_by?: string;
  scan_count: number;
  
  // Delivery completion
  delivered_at?: string;
  delivered_by?: string;
  delivery_photo_url?: string;
  delivery_signature_url?: string;
  delivery_notes?: string;
  customer_rating?: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  order?: Order;
  sale?: Sale;
  driver?: User;
  scan_history?: BarcodeScanLog[];
}

export interface BarcodeScanLog {
  id: string;
  barcode_id: string;
  barcode: string;
  
  // Scan details
  scanned_at: string;
  scanned_by?: string;
  scan_type: ScanType;
  
  // Location
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  location_address?: string;
  
  // Device info
  device_type?: string;
  device_id?: string;
  user_agent?: string;
  
  // Status change
  old_status?: string;
  new_status?: string;
  
  // Notes and attachments
  notes?: string;
  photo_url?: string;
  
  created_at?: string;
  
  // Joined data
  user?: User;
}

export interface DeliveryRouteTracking {
  id: string;
  barcode_id: string;
  driver_id: string;
  
  // Location
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  
  // Timestamp
  recorded_at: string;
  
  // Battery and connectivity
  battery_level?: number;
  is_online: boolean;
  
  created_at?: string;
}

export interface BarcodeDetails {
  barcode: string;
  status: BarcodeStatus;
  customer_name: string;
  customer_phone?: string;
  delivery_location?: string;
  quantity_kg: number;
  total_amount: number;
  generated_at: string;
  first_scan_at?: string;
  last_scan_at?: string;
  scan_count: number;
  delivered_at?: string;
  delivery_photo_url?: string;
  delivery_notes?: string;
  customer_rating?: number;
  scan_history?: BarcodeScanLog[];
}


