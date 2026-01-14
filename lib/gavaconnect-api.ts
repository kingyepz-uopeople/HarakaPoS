/**
 * GavaConnect API Client
 * Kenya Government Digital Services Gateway
 * Invoice Checker API for eTIMS compliance testing
 * 
 * Sandbox: https://sandbox.go.ke
 * Production: https://api.go.ke
 */

import { createClient } from '@/lib/supabase/client';

interface GavaConnectConfig {
  consumerKey: string;
  consumerSecret: string;
  environment: 'sandbox' | 'production';
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface InvoiceCheckRequest {
  invoiceNumber: string;
  sellerPin?: string;
  buyerPin?: string;
  invoiceDate?: string;
  totalAmount?: number;
}

interface InvoiceCheckResponse {
  success: boolean;
  valid: boolean;
  message: string;
  data?: {
    invoiceNumber: string;
    status: string;
    sellerName?: string;
    sellerPin?: string;
    buyerName?: string;
    buyerPin?: string;
    invoiceDate?: string;
    totalAmount?: number;
    vatAmount?: number;
    qrCode?: string;
    verificationUrl?: string;
  };
  error?: string;
}

export class GavaConnectClient {
  private config: GavaConnectConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl: string;
  private authUrl: string;
  private supabase = createClient();

  constructor() {
    const environment = (process.env.NEXT_PUBLIC_GAVACONNECT_ENV || 'sandbox') as 'sandbox' | 'production';
    
    this.config = {
      consumerKey: process.env.NEXT_PUBLIC_GAVACONNECT_CONSUMER_KEY || '',
      consumerSecret: process.env.GAVACONNECT_CONSUMER_SECRET || '',
      environment,
    };

    // Set URLs based on environment
    if (environment === 'production') {
      this.baseUrl = 'https://api.go.ke';
      this.authUrl = 'https://api.go.ke/oauth/token';
    } else {
      this.baseUrl = 'https://sandbox.go.ke';
      this.authUrl = 'https://sandbox.go.ke/oauth/token';
    }
  }

  /**
   * Check if GavaConnect is configured
   */
  isConfigured(): boolean {
    return !!(this.config.consumerKey && this.config.consumerSecret);
  }

  /**
   * Get OAuth2 access token using client credentials
   */
  private async getAccessToken(): Promise<string | null> {
    // Check if we have a valid cached token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.isConfigured()) {
      console.error('GavaConnect not configured');
      return null;
    }

    try {
      // Create base64 encoded credentials (similar to M-Pesa pattern)
      const credentials = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString('base64');

      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GavaConnect auth error:', errorText);
        return null;
      }

      const data: TokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      // Set expiry 1 minute before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get GavaConnect access token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: object
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const token = await this.getAccessToken();
    
    if (!token) {
      return { success: false, error: 'Authentication failed' };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || data.error || `HTTP ${response.status}` 
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error('GavaConnect API error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API request failed' 
      };
    }
  }

  /**
   * Check/Verify an invoice with KRA via GavaConnect
   */
  async checkInvoice(request: InvoiceCheckRequest): Promise<InvoiceCheckResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        valid: false,
        message: 'GavaConnect not configured',
        error: 'Missing consumer key or secret',
      };
    }

    // Log the request
    await this.logRequest('invoice_check', request);

    const result = await this.apiRequest<any>('/invoice-checker/v1/verify', 'POST', {
      invoiceNumber: request.invoiceNumber,
      sellerPin: request.sellerPin,
      buyerPin: request.buyerPin,
      invoiceDate: request.invoiceDate,
      totalAmount: request.totalAmount,
    });

    // Log the response
    await this.logRequest('invoice_check', request, result);

    if (!result.success) {
      return {
        success: false,
        valid: false,
        message: result.error || 'Invoice check failed',
        error: result.error,
      };
    }

    return {
      success: true,
      valid: result.data?.valid || result.data?.status === 'VALID',
      message: result.data?.message || 'Invoice verified',
      data: result.data,
    };
  }

  /**
   * Submit an invoice to eTIMS via GavaConnect (if supported)
   * Note: This endpoint may vary based on GavaConnect's actual API
   */
  async submitInvoice(invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    sellerPin: string;
    sellerName: string;
    buyerPin?: string;
    buyerName?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      totalAmount: number;
    }>;
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
  }): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'GavaConnect not configured',
        error: 'Missing credentials',
      };
    }

    await this.logRequest('invoice_submit', invoice);

    // Try the invoice submission endpoint
    const result = await this.apiRequest<any>('/etims/v1/invoice/submit', 'POST', invoice);

    await this.logRequest('invoice_submit', invoice, result);

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Invoice submission failed',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Invoice submitted successfully',
      data: result.data,
    };
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(invoiceNumber: string): Promise<{ success: boolean; status?: string; data?: any; error?: string }> {
    const result = await this.apiRequest<any>(`/invoice-checker/v1/status/${invoiceNumber}`, 'GET');

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      status: result.data?.status,
      data: result.data,
    };
  }

  /**
   * Log API requests for debugging
   */
  private async logRequest(type: string, request: any, response?: any): Promise<void> {
    try {
      await this.supabase.from('etims_sync_logs').insert({
        sync_type: `gavaconnect_${type}`,
        request_data: request,
        response_data: response || null,
        status: response?.success ? 'success' : (response ? 'error' : 'pending'),
        error_message: response?.error || null,
      });
    } catch (e) {
      console.error('Failed to log GavaConnect request:', e);
    }
  }

  /**
   * Test the connection to GavaConnect
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { 
        success: false, 
        message: 'GavaConnect credentials not configured. Add NEXT_PUBLIC_GAVACONNECT_CONSUMER_KEY and GAVACONNECT_CONSUMER_SECRET to your environment.' 
      };
    }

    const token = await this.getAccessToken();
    
    if (token) {
      return { 
        success: true, 
        message: `Connected to GavaConnect ${this.config.environment} environment successfully!` 
      };
    }

    return { 
      success: false, 
      message: 'Failed to authenticate with GavaConnect. Please check your credentials.' 
    };
  }
}

// Export a singleton instance
export const gavaConnect = new GavaConnectClient();
