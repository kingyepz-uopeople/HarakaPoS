/**
 * Database Types for HarakaPOS
 * These types match the Supabase database schema
 */

export type UserRole = "admin" | "driver";

export type PaymentMethod = "Cash" | "M-Pesa";

export type DeliveryStatus = "Pending" | "On the Way" | "Delivered";

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
  amount: number;
  payment_method: PaymentMethod;
  quantity_sold: number;
  driver_id?: string;
  customer_name: string;
  customer_phone?: string;
  delivery_status: DeliveryStatus;
  delivery_location?: string;
  price_per_kg?: number; // Generated column, optional on insert
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
}
