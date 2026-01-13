/**
 * SMS Configuration API Endpoint
 * GET /api/sms/register - Check configuration status
 * 
 * No registration needed with TalkSasa v3 API!
 * Just add your API key to environment variables.
 */

import { NextResponse } from 'next/server';
import { getSMSConfigStatus } from '@/lib/sms';

/**
 * GET /api/sms/register
 * Check SMS configuration status
 */
export async function GET() {
  const status = getSMSConfigStatus();

  if (status.isConfigured) {
    return NextResponse.json({
      status: 'configured',
      message: 'SMS is ready to use',
      senderId: status.senderId
    });
  }

  return NextResponse.json({
    status: 'not_configured',
    message: 'Add environment variables to enable SMS',
    required: [
      'TALKSASA_API_KEY=your_api_token',
      'TALKSASA_SENDER_ID=HarakaPOS'
    ],
    instructions: [
      '1. Sign up at https://bulksms.talksasa.com/register',
      '2. Get your API token from the dashboard',
      '3. Add to .env.local:',
      '   TALKSASA_API_KEY=your_token',
      '   TALKSASA_SENDER_ID=HarakaPOS',
      '4. Restart your development server'
    ]
  });
}
