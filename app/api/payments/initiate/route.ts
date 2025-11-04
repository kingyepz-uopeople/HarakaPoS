import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initiateMpesaSTKPush } from '@/lib/mpesa';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, phoneNumber, initiatedFrom } = body;

    if (!orderId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Order ID and phone number are required' },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate amount
    const amount = order.total_price || (order.quantity_kg * order.price_per_kg);

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount: amount,
        payment_method: 'mpesa',
        payment_status: 'processing',
        phone_number: phoneNumber,
        initiated_by: user.id,
        initiated_from: initiatedFrom || 'admin',
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    try {
      // Initiate M-Pesa STK Push
      const mpesaResponse = await initiateMpesaSTKPush({
        phoneNumber: phoneNumber,
        amount: amount,
        accountReference: `Order-${order.id.substring(0, 8)}`,
        transactionDesc: `Payment for ${order.quantity_kg}kg potatoes`,
      });

      // Update payment with M-Pesa request ID
      await supabase
        .from('payments')
        .update({
          mpesa_request_id: mpesaResponse.CheckoutRequestID,
        })
        .eq('id', payment.id);

      return NextResponse.json({
        success: true,
        message: 'Payment request sent to customer phone',
        paymentId: payment.id,
        checkoutRequestId: mpesaResponse.CheckoutRequestID,
        customerMessage: mpesaResponse.CustomerMessage,
      });

    } catch (mpesaError: any) {
      console.error('M-Pesa STK Push error:', mpesaError);

      // Update payment status to failed
      await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          failure_reason: mpesaError.message || 'M-Pesa request failed',
        })
        .eq('id', payment.id);

      return NextResponse.json(
        { 
          error: 'Failed to initiate M-Pesa payment',
          details: mpesaError.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
