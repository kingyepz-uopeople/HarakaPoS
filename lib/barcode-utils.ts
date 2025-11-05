/**
 * Barcode Delivery Tracking Utilities
 * Generate and manage delivery barcodes for Haraka Wedges Supplies
 */

import { createClient } from '@/lib/supabase/client';
import { DeliveryBarcode, BarcodeScanLog, ScanType, BarcodeStatus } from './types';

/**
 * Generate a new delivery barcode
 */
export async function generateDeliveryBarcode(params: {
  orderId?: string;
  saleId?: string;
  customerName: string;
  customerPhone?: string;
  deliveryLocation?: string;
  quantityKg: number;
  totalAmount: number;
}): Promise<{ success: boolean; barcode?: string; barcodeId?: string; error?: string }> {
  const supabase = createClient();

  try {
    // Generate unique barcode using database function
    const { data: barcodeData, error: barcodeError } = await supabase.rpc('generate_delivery_barcode');

    if (barcodeError || !barcodeData) {
      console.error('Error generating barcode:', barcodeError);
      return { success: false, error: 'Failed to generate barcode number' };
    }

    const newBarcode = barcodeData as string;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Insert barcode record
    const { data: record, error: insertError } = await supabase
      .from('delivery_barcodes')
      .insert({
        barcode: newBarcode,
        order_id: params.orderId || null,
        sale_id: params.saleId || null,
        customer_name: params.customerName,
        customer_phone: params.customerPhone || null,
        delivery_location: params.deliveryLocation || null,
        quantity_kg: params.quantityKg,
        total_amount: params.totalAmount,
        generated_by: user?.id || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting barcode:', insertError);
      return { success: false, error: insertError.message };
    }

    // Log the generation
    await logBarcodeScan({
      barcode: newBarcode,
      scanType: 'generate',
      notes: 'Barcode generated',
    });

    return {
      success: true,
      barcode: newBarcode,
      barcodeId: record.id,
    };
  } catch (error: any) {
    console.error('Error in generateDeliveryBarcode:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log a barcode scan
 */
export async function logBarcodeScan(params: {
  barcode: string;
  scanType: ScanType;
  newStatus?: BarcodeStatus;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  notes?: string;
  photoUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const result = await supabase.rpc('log_barcode_scan', {
      p_barcode: params.barcode,
      p_user_id: user?.id || null,
      p_scan_type: params.scanType,
      p_latitude: params.latitude || null,
      p_longitude: params.longitude || null,
      p_new_status: params.newStatus || null,
      p_notes: params.notes || null,
      p_photo_url: params.photoUrl || null,
    });

    if (result.error) {
      console.error('Error logging scan:', result.error);
      return { success: false, error: result.error.message };
    }

    const response = result.data as any;
    if (!response.success) {
      return { success: false, error: response.error || 'Scan logging failed' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in logBarcodeScan:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get barcode details with scan history
 */
export async function getBarcodeDetails(barcode: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc('get_barcode_details', {
      p_barcode: barcode,
    });

    if (error) {
      console.error('Error getting barcode details:', error);
      return { success: false, error: error.message };
    }

    const details = data as any;
    if (details.error) {
      return { success: false, error: details.error };
    }

    return { success: true, data: details };
  } catch (error: any) {
    console.error('Error in getBarcodeDetails:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update barcode status
 */
export async function updateBarcodeStatus(
  barcode: string,
  newStatus: BarcodeStatus,
  scanType: ScanType,
  options?: {
    latitude?: number;
    longitude?: number;
    notes?: string;
    photoUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return await logBarcodeScan({
    barcode,
    scanType,
    newStatus,
    ...options,
  });
}

/**
 * Get current location from browser
 */
export async function getCurrentLocation(): Promise<{
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
}> {
  if (!navigator.geolocation) {
    return { error: 'Geolocation not supported by browser' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve({ error: error.message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Track delivery route (for drivers)
 */
export async function trackDeliveryRoute(
  barcodeId: string,
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  },
  options?: {
    batteryLevel?: number;
    isOnline?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('delivery_route_tracking').insert({
      barcode_id: barcodeId,
      driver_id: user?.id || null,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      altitude: location.altitude || null,
      speed: location.speed || null,
      heading: location.heading || null,
      battery_level: options?.batteryLevel || null,
      is_online: options?.isOnline ?? true,
    });

    if (error) {
      console.error('Error tracking route:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in trackDeliveryRoute:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get delivery statistics
 */
export async function getDeliveryStatistics(dateRange?: {
  start: string;
  end: string;
}): Promise<{
  total: number;
  pending: number;
  in_transit: number;
  delivered: number;
  failed: number;
  success_rate: number;
}> {
  const supabase = createClient();

  let query = supabase.from('delivery_barcodes').select('status', { count: 'exact' });

  if (dateRange) {
    query = query.gte('generated_at', dateRange.start).lte('generated_at', dateRange.end);
  }

  const { data, count } = await query;

  const stats = {
    total: count || 0,
    pending: 0,
    in_transit: 0,
    delivered: 0,
    failed: 0,
    success_rate: 0,
  };

  if (data) {
    data.forEach((item: any) => {
      if (item.status === 'pending' || item.status === 'printed' || item.status === 'loading') {
        stats.pending++;
      } else if (item.status === 'in_transit') {
        stats.in_transit++;
      } else if (item.status === 'delivered') {
        stats.delivered++;
      } else if (item.status === 'failed' || item.status === 'cancelled') {
        stats.failed++;
      }
    });

    stats.success_rate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
  }

  return stats;
}
