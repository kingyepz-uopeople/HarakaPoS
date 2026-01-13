/**
 * SMS Send API Endpoint
 * POST /api/sms/send
 * 
 * Sends SMS notifications using TalkSasa/Ladybird API
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendBulkSMS, isSMSConfigured, getSMSConfigStatus } from '@/lib/sms';
import { getSMSByEvent, SMSEventType, getMessageStats } from '@/lib/sms-templates';
import { createClient } from '@/lib/supabase/server';

interface SendSMSRequest {
  // Direct message send
  phone?: string;
  message?: string;
  
  // Template-based send
  eventType?: SMSEventType;
  orderId?: string;
  
  // Bulk send
  phones?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check SMS configuration
    if (!isSMSConfigured()) {
      const status = getSMSConfigStatus();
      return NextResponse.json(
        { 
          error: 'SMS service not configured',
          details: status
        },
        { status: 503 }
      );
    }

    const body: SendSMSRequest = await request.json();
    
    // Validate request
    if (!body.phone && !body.phones && !body.orderId) {
      return NextResponse.json(
        { error: 'Either phone, phones array, or orderId is required' },
        { status: 400 }
      );
    }

    // Template-based send using order data
    if (body.orderId && body.eventType) {
      const supabase = await createClient();
      
      // Fetch order with customer details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          quantity_kg,
          total_price,
          delivery_date,
          delivery_time,
          tracking_url,
          estimated_arrival_time,
          assigned_driver,
          customer:customers (
            id,
            name,
            phone
          ),
          driver:users!assigned_driver (
            id,
            name
          )
        `)
        .eq('id', body.orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: 'Order not found', details: orderError?.message },
          { status: 404 }
        );
      }

      // Handle Supabase relations - they come back as arrays
      const customerData = order.customer as unknown as { id: string; name: string; phone: string }[] | null;
      const driverData = order.driver as unknown as { id: string; name: string }[] | null;
      
      const customer = Array.isArray(customerData) ? customerData[0] : customerData;
      const driver = Array.isArray(driverData) ? driverData[0] : driverData;

      if (!customer?.phone) {
        return NextResponse.json(
          { error: 'Customer phone number not found' },
          { status: 400 }
        );
      }

      // Build template data
      const templateData = {
        orderId: order.id,
        customerName: customer.name || 'Customer',
        quantity: order.quantity_kg,
        totalAmount: order.total_price || 0,
        deliveryDate: order.delivery_date,
        deliveryTime: order.delivery_time,
        trackingUrl: order.tracking_url,
        driverName: driver?.name,
        eta: order.estimated_arrival_time
      };

      // Generate message from template
      const message = getSMSByEvent(body.eventType, templateData);
      const stats = getMessageStats(message);

      // Send SMS
      const result = await sendSMS(customer.phone, message);

      // Log SMS in database (optional, for tracking)
      try {
        await supabase.from('sms_logs').insert({
          order_id: body.orderId,
          phone: customer.phone,
          message: message,
          event_type: body.eventType,
          status: result.success ? 'sent' : 'failed',
          task_id: result.uid,
          error: result.error
        });
      } catch {
        // SMS logs table might not exist yet, that's okay
        console.log('SMS log insert skipped (table may not exist)');
      }

      return NextResponse.json({
        success: result.success,
        uid: result.uid,
        message: message,
        stats: stats,
        error: result.error
      });
    }

    // Direct message send
    if (body.phone && body.message) {
      const result = await sendSMS(body.phone, body.message);
      const stats = getMessageStats(body.message);

      return NextResponse.json({
        success: result.success,
        uid: result.uid,
        stats: stats,
        error: result.error
      });
    }

    // Bulk send
    if (body.phones && body.message) {
      const result = await sendBulkSMS(body.phones, body.message);
      const stats = getMessageStats(body.message);

      return NextResponse.json({
        success: result.failed === 0,
        sent: result.successful,
        failed: result.failed,
        stats: stats,
        results: result.results
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide phone+message, phones+message, or orderId+eventType' },
      { status: 400 }
    );

  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sms/send
 * Check SMS configuration status
 */
export async function GET() {
  const status = getSMSConfigStatus();
  
  return NextResponse.json({
    configured: status.isConfigured,
    senderId: status.senderId,
    status: status.isConfigured ? 'ready' : 'not_configured',
    message: status.isConfigured 
      ? 'SMS service is ready' 
      : 'Add TALKSASA_PROXY_KEY and TALKSASA_SENDER_ID to environment variables'
  });
}
