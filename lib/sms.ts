/**
 * TalkSasa SMS Integration for HarakaPOS
 * Uses the TalkSasa v3 Bulk SMS API for direct delivery across Kenya & Tanzania
 * 
 * API Documentation: https://bulksms.talksasa.com/api/v3
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create an account at https://bulksms.talksasa.com/register
 * 2. Get your API token from the dashboard
 * 3. Add to .env.local:
 *    TALKSASA_API_KEY=your_api_token
 *    TALKSASA_SENDER_ID=HarakaPOS (or your approved sender name)
 * 
 * That's it! No proxy registration needed.
 * 
 * PRICING:
 * - Competitive rates for Kenya & Tanzania
 * - Check https://talksasa.com/pricing for current rates
 */

const TALKSASA_API_URL = 'https://bulksms.talksasa.com/api/v3/sms';

export interface SMSResult {
  success: boolean;
  uid?: string;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Format phone number to E.164 format for Kenya (2547...)
 * Accepts various formats: 0712345678, +254712345678, 254712345678, 712345678
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove + prefix if present
  cleaned = cleaned.replace(/^\+/, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    // Local format: 0712345678 -> 254712345678
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    // Short format: 712345678 -> 254712345678
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('1') && cleaned.length === 9) {
    // Safaricom new prefix: 112345678 -> 254112345678
    cleaned = '254' + cleaned;
  }
  
  // Validate Kenya phone number format
  if (!cleaned.startsWith('254') || cleaned.length !== 12) {
    console.warn(`Phone number may not be valid Kenyan format: ${cleaned}`);
  }
  
  return cleaned;
}

/**
 * Send an SMS using TalkSasa v3 API
 * @param recipient - Phone number in any format (will be normalized)
 * @param message - SMS content (max 160 chars for single SMS)
 * @returns Result with success status and message UID
 */
export async function sendSMS(
  recipient: string,
  message: string
): Promise<SMSResult> {
  const apiKey = process.env.TALKSASA_API_KEY;
  const senderId = process.env.TALKSASA_SENDER_ID || 'HarakaPOS';

  if (!apiKey) {
    console.error('SMS not configured: TALKSASA_API_KEY missing');
    return {
      success: false,
      error: 'SMS service not configured. Please add TALKSASA_API_KEY to environment variables.'
    };
  }

  const formattedPhone = formatPhoneNumber(recipient);
  
  // Warn if message is too long for single SMS
  if (message.length > 160) {
    console.warn(`SMS message is ${message.length} chars (>${160}). Will be split into multiple messages.`);
  }

  try {
    const response = await fetch(`${TALKSASA_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: senderId,
        type: 'plain',
        message: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TalkSasa send failed:', errorText);
      return {
        success: false,
        error: `SMS send failed: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log(`SMS sent successfully to ${formattedPhone}`);
      return {
        success: true,
        uid: data.data?.uid,
        data: data.data
      };
    } else {
      return {
        success: false,
        error: data.message || 'Unknown error from TalkSasa'
      };
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending SMS'
    };
  }
}

/**
 * Send SMS to multiple recipients
 * Respects rate limit of 20 SMS/second by batching
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string
): Promise<{ successful: number; failed: number; results: SMSResult[] }> {
  const results: SMSResult[] = [];
  let successful = 0;
  let failed = 0;

  // Process in batches of 20 (rate limit)
  const batchSize = 20;
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    // Send batch in parallel
    const batchResults = await Promise.all(
      batch.map(recipient => sendSMS(recipient, message))
    );
    
    batchResults.forEach(result => {
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    });
    
    // Wait 1 second between batches to respect rate limit
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { successful, failed, results };
}

/**
 * Check if SMS is configured and ready to use
 */
export function isSMSConfigured(): boolean {
  return !!(process.env.TALKSASA_API_KEY && process.env.TALKSASA_SENDER_ID);
}

/**
 * Get SMS configuration status for debugging
 */
export function getSMSConfigStatus(): {
  isConfigured: boolean;
  hasApiKey: boolean;
  hasSenderId: boolean;
  senderId?: string;
} {
  return {
    isConfigured: isSMSConfigured(),
    hasApiKey: !!process.env.TALKSASA_API_KEY,
    hasSenderId: !!process.env.TALKSASA_SENDER_ID,
    senderId: process.env.TALKSASA_SENDER_ID
  };
}
