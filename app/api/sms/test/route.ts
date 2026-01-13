/**
 * SMS Test Endpoint
 * POST /api/sms/test
 * 
 * Quick test to send an SMS directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, getSMSConfigStatus } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    const testMessage = message || 'Test SMS from HarakaPOS. If you received this, SMS integration is working! 🎉';

    console.log('[SMS TEST] Sending test SMS to:', phone);
    
    const result = await sendSMS(phone, testMessage);

    console.log('[SMS TEST] Result:', result);

    return NextResponse.json({
      success: result.success,
      uid: result.uid,
      phone: phone,
      message: testMessage,
      error: result.error,
      data: result.data
    });

  } catch (error) {
    console.error('[SMS TEST] Error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = getSMSConfigStatus();
  
  return NextResponse.json({
    status: 'SMS Test Endpoint',
    configured: status.isConfigured,
    senderId: status.senderId,
    instructions: {
      howToTest: 'POST to this endpoint with { "phone": "0712345678" }',
      example: 'curl -X POST http://localhost:3000/api/sms/test -H "Content-Type: application/json" -d \'{"phone":"0791890858"}\'',
      customMessage: 'Add "message" field to send custom text'
    }
  });
}
