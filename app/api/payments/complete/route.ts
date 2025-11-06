import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Complete Payment (PDA Terminal Flow)
 * Driver confirms payment received via cash or M-Pesa on PDA
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount, paymentMethod, reference, initiatedFrom } = body;

    if (!orderId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create payment record
    const paymentData: any = {
      order_id: orderId,
      amount: amount,
      payment_method: paymentMethod,
      payment_status: 'completed', // Completed immediately for PDA flow
      initiated_by: user.id,
      initiated_from: initiatedFrom || 'driver',
    };

    // Add method-specific fields
    if (paymentMethod === 'mpesa') {
      paymentData.mpesa_receipt_number = reference; // M-Pesa confirmation code
      paymentData.transaction_id = reference;
      paymentData.notes = `M-Pesa payment confirmed on PDA. Code: ${reference}`;
    } else if (paymentMethod === 'cash') {
      paymentData.notes = `Cash payment. Received: KES ${reference}`;
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    // Generate receipt
    const receiptItems = [
      {
        description: `Processed Potatoes (${order.quantity_kg}kg)`,
        quantity: order.quantity_kg,
        unit_price: order.price_per_kg,
        total: order.total_price || (order.quantity_kg * order.price_per_kg),
      },
    ];

    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        order_id: orderId,
        payment_id: payment.id,
        receipt_number: '', // Empty string triggers auto-generation
        issued_to: order.customer?.name || 'Customer',
        issued_by: user.id,
        items: JSON.stringify(receiptItems),
        subtotal: order.total_price || (order.quantity_kg * order.price_per_kg),
        tax: 0,
        total: order.total_price || (order.quantity_kg * order.price_per_kg),
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (receiptError) {
      console.error('Error creating receipt:', receiptError);
      // Don't fail the whole request, receipt can be regenerated
    }

    // Update order status to Completed
    await supabase
      .from('orders')
      .update({
        delivery_status: 'Completed',
        updated_by: user.id,
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: payment.id,
      receiptId: receipt?.id,
      receiptNumber: receipt?.receipt_number,
    });

  } catch (error: any) {
    console.error('Payment completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
