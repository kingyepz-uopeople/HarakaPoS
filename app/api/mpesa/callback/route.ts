import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * M-Pesa Callback Handler
 * This receives payment status from Safaricom after STK Push
 * URL: https://yourdomain.com/api/mpesa/callback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const supabase = await createClient();

    // Extract callback data
    const { Body } = body;
    const { stkCallback } = Body || {};

    if (!stkCallback) {
      console.error('Invalid callback format');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback format' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Find the payment by CheckoutRequestID
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('mpesa_request_id', CheckoutRequestID)
      .single();

    if (findError || !payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Payment not found' });
    }

    // ResultCode 0 = Success
    if (ResultCode === 0) {
      // Extract payment details from callback metadata
      const metadata = CallbackMetadata?.Item || [];
      const getMetadataValue = (name: string) => {
        const item = metadata.find((i: any) => i.Name === name);
        return item?.Value;
      };

      const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
      const transactionDate = getMetadataValue('TransactionDate');
      const phoneNumber = getMetadataValue('PhoneNumber');
      const amount = getMetadataValue('Amount');

      // Update payment to completed
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          mpesa_receipt_number: mpesaReceiptNumber,
          transaction_id: mpesaReceiptNumber,
          phone_number: phoneNumber?.toString(),
          notes: `Paid on ${transactionDate}. Amount: KES ${amount}`,
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Error updating payment:', updateError);
      } else {
        console.log('Payment completed successfully:', mpesaReceiptNumber);

        // Auto-generate receipt
        try {
          const { data: order } = await supabase
            .from('orders')
            .select('*, customer:customers(*)')
            .eq('id', payment.order_id)
            .single();

          if (order) {
            await supabase.from('receipts').insert({
              order_id: payment.order_id,
              payment_id: payment.id,
              issued_to: order.customer?.name || 'Customer',
              items: JSON.stringify([
                {
                  description: `Processed Potatoes (${order.quantity_kg}kg)`,
                  quantity: order.quantity_kg,
                  unit_price: order.price_per_kg,
                  total: order.total_price || (order.quantity_kg * order.price_per_kg),
                },
              ]),
              subtotal: order.total_price || (order.quantity_kg * order.price_per_kg),
              tax: 0,
              total: order.total_price || (order.quantity_kg * order.price_per_kg),
              payment_method: 'mpesa',
            });
          }
        } catch (receiptError) {
          console.error('Error creating receipt:', receiptError);
        }
      }

    } else {
      // Payment failed
      const { error: failError } = await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          failure_reason: ResultDesc,
        })
        .eq('id', payment.id);

      if (failError) {
        console.error('Error updating failed payment:', failError);
      } else {
        console.log('Payment failed:', ResultDesc);
      }
    }

    // Always return success to M-Pesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully',
    });

  } catch (error: any) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: error.message || 'Internal server error',
    });
  }
}
