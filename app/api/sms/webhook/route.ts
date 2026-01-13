/**
 * SMS Delivery Webhook Handler
 * GET /api/sms/webhook
 * 
 * Receives delivery status callbacks from TalkSasa/Ladybird
 * Configure webhook URL in TalkSasa dashboard: https://yourdomain.com/api/sms/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DeliveryWebhookParams {
  username: string;
  action: string;
  destination: string;
  status: string;
  message: string;
  reseller_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: DeliveryWebhookParams = {
      username: searchParams.get('username') || '',
      action: searchParams.get('action') || '',
      destination: searchParams.get('destination') || '',
      status: searchParams.get('status') || '',
      message: searchParams.get('message') || '',
      reseller_id: searchParams.get('reseller_id') || ''
    };

    // Validate this is a delivery callback
    if (params.action !== 'delivery') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    console.log('SMS delivery webhook received:', {
      phone: params.destination,
      status: params.status,
      reseller_id: params.reseller_id
    });

    // Update SMS log if we have the table
    try {
      const supabase = await createClient();
      
      await supabase
        .from('sms_logs')
        .update({
          delivery_status: params.status,
          delivered_at: params.status === 'Delivered' ? new Date().toISOString() : null
        })
        .eq('phone', params.destination)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (dbError) {
      // Table might not exist, that's okay
      console.log('SMS log update skipped:', dbError);
    }

    // Return OK to acknowledge receipt
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
