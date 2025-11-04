/**
 * M-Pesa Daraja API Integration
 * Supports STK Push (Lipa Na M-Pesa Online)
 * 
 * Setup required:
 * 1. Get credentials from https://developer.safaricom.co.ke
 * 2. Add to .env.local:
 *    MPESA_CONSUMER_KEY=your_consumer_key
 *    MPESA_CONSUMER_SECRET=your_consumer_secret
 *    MPESA_PASSKEY=your_passkey
 *    MPESA_SHORTCODE=your_business_shortcode
 *    MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
 *    MPESA_ENVIRONMENT=sandbox (or production)
 */

const MPESA_BASE_URL = process.env.MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

interface MpesaAccessTokenResponse {
  access_token: string;
  expires_in: string;
}

interface MpesaSTKPushPayload {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: 'CustomerPayBillOnline';
  Amount: number;
  PartyA: string; // Phone number
  PartyB: string; // Shortcode
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

/**
 * Get M-Pesa access token
 */
export async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${response.statusText}`);
  }

  const data: MpesaAccessTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Generate M-Pesa password
 */
function generateMpesaPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  return password;
}

/**
 * Get current timestamp in M-Pesa format (YYYYMMDDHHmmss)
 */
function getMpesaTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Format phone number to M-Pesa format (254XXXXXXXXX)
 */
export function formatMpesaPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If starts with +254, remove the +
  if (cleaned.startsWith('254')) {
    return cleaned;
  }
  
  // If starts with 7 or 1, add 254
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return '254' + cleaned;
  }
  
  return cleaned;
}

/**
 * Initiate M-Pesa STK Push
 */
export async function initiateMpesaSTKPush(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}) {
  const { phoneNumber, amount, accountReference, transactionDesc } = params;

  // Validate configuration
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error('M-Pesa configuration incomplete. Check your environment variables.');
  }

  // Get access token
  const accessToken = await getMpesaAccessToken();

  // Generate timestamp and password
  const timestamp = getMpesaTimestamp();
  const password = generateMpesaPassword(timestamp);

  // Format phone number
  const formattedPhone = formatMpesaPhoneNumber(phoneNumber);

  // Prepare payload
  const payload: MpesaSTKPushPayload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount), // M-Pesa doesn't accept decimals
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  // Make STK Push request
  const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`M-Pesa STK Push failed: ${data.errorMessage || response.statusText}`);
  }

  return data;
}

/**
 * Query M-Pesa transaction status
 */
export async function queryMpesaTransactionStatus(checkoutRequestId: string) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  if (!shortcode || !passkey) {
    throw new Error('M-Pesa configuration incomplete');
  }

  const accessToken = await getMpesaAccessToken();
  const timestamp = getMpesaTimestamp();
  const password = generateMpesaPassword(timestamp);

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`M-Pesa query failed: ${data.errorMessage || response.statusText}`);
  }

  return data;
}
