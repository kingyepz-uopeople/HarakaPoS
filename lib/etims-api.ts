/**
 * eTIMS OSCU API Client for Kenya Revenue Authority
 * Online Sales Control Unit (System-to-System Integration)
 * For cloud-based applications without physical hardware
 */

import { createClient } from '@/lib/supabase/client';
import { EtimsConfig, EtimsInvoice, EtimsInvoiceItem } from './types';

export class EtimsApiClient {
  private config: EtimsConfig | null = null;
  private supabase = createClient();
  private apiUrl: string;

  constructor() {
    // Use environment variable or fallback to config
    this.apiUrl = process.env.NEXT_PUBLIC_ETIMS_API_URL || 'https://etims-api-sbx.kra.go.ke/etims-api';
  }

  /**
   * Get the appropriate API URL based on provider
   */
  private getApiUrl(): string {
    if (!this.config) return this.apiUrl;
    
    if (this.config.provider === 'gavaconnect') {
      // GavaConnect API endpoint
      return this.config.environment === 'production'
        ? 'https://api.gavaconnect.com/v1/products/etims'
        : 'https://sandbox-api.gavaconnect.com/v1/products/etims';
    }
    
    // Direct KRA API
    return this.config.api_base_url || this.apiUrl;
  }

  /**
   * Get authentication headers based on provider
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config?.provider === 'gavaconnect') {
      // GavaConnect authentication
      if (this.config.gavaconnect_app_id && this.config.gavaconnect_api_key) {
        headers['X-App-ID'] = this.config.gavaconnect_app_id;
        headers['X-API-Key'] = this.config.gavaconnect_api_key;
        
        if (this.config.gavaconnect_api_secret) {
          headers['X-API-Secret'] = this.config.gavaconnect_api_secret;
        }
      }
    }

    return headers;
  }

  /**
   * Initialize the eTIMS client with configuration
   */
  async initialize(): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('etims_config')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Failed to load eTIMS configuration:', error);
      return false;
    }

    this.config = data;
    return true;
  }

  /**
   * Get current configuration
   */
  getConfig(): EtimsConfig | null {
    return this.config;
  }

  /**
   * Initialize OSCU with KRA (System-to-System)
   * No physical device required - cloud-based integration
   */
  async initializeOSCU(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) {
      await this.initialize();
    }

    if (!this.config) {
      return { success: false, message: 'eTIMS not configured' };
    }

    try {
      const endpoint = `${this.getApiUrl()}/initializer/selectInitInfo`;
      
      const requestData = {
        tin: this.config.tin || this.config.kra_pin,
        bhfId: this.config.bhf_id || '00',
        dvcSrlNo: this.config.oscu_device_id || `OSCU-${this.config.kra_pin}`,
      };

      // Log request
      await this.logSync('oscu_init', requestData, null);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Log response
      await this.logSync('oscu_init', requestData, result);

      if (result.resultCd === '000') {
        // Update config status with OSCU serial from KRA
        await this.supabase
          .from('etims_config')
          .update({
            oscu_status: 'active',
            oscu_serial_number: result.data?.csuSerialNo || requestData.dvcSrlNo,
            device_initialization_date: new Date().toISOString(),
          })
          .eq('id', this.config.id);

        return { 
          success: true, 
          message: 'OSCU initialized successfully',
          data: result.data 
        };
      } else {
        return { 
          success: false, 
          message: result.resultMsg || 'OSCU initialization failed' 
        };
      }
    } catch (error: any) {
      await this.logSync('oscu_init', {}, null, 'failed', error.message);
      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
  }

  /**
   * Submit invoice to KRA via OSCU (Online Sales Control Unit)
   */
  async submitInvoice(invoiceId: string): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) {
      await this.initialize();
    }

    if (!this.config) {
      return { success: false, message: 'eTIMS not configured' };
    }

    if (this.config.oscu_status !== 'active') {
      return { success: false, message: 'OSCU not initialized. Please initialize first.' };
    }

    try {
      // Get invoice from database
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('etims_invoices')
        .select(`
          *,
          items:etims_invoice_items(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return { success: false, message: 'Invoice not found' };
      }

      // Build KRA OSCU payload
      const requestData = this.buildOSCUPayload(invoice);

      const endpoint = `${this.getApiUrl()}/trnsSales/saveSales`;

      // Log request
      await this.logSync('submit_invoice', requestData, null, 'success', null, invoiceId);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Log response
      await this.logSync('submit_invoice', requestData, result, 'success', null, invoiceId);

      if (result.resultCd === '000') {
        // Extract KRA response data
        const kraData = result.data || {};
        const rcptNo = kraData.rcptNo || kraData.invoiceNo;
        const csuSerialNo = kraData.csuSerialNo;
        const bCode = kraData.bCode; // QR Code URL from KRA

        // Update invoice with KRA response
        await this.supabase
          .from('etims_invoices')
          .update({
            submission_status: 'approved',
            submission_date: new Date().toISOString(),
            kra_response: result,
            kra_invoice_number: rcptNo,
            kra_verification_url: this.generateVerificationUrl(rcptNo),
            qr_code_url: bCode, // KRA-provided QR code URL
            oscu_serial_number: csuSerialNo, // Save Control Unit Serial from response
            receipt_signature: kraData.rcptSign,
            signature_date: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        return { 
          success: true, 
          message: 'Invoice submitted successfully to KRA',
          data: {
            rcptNo,
            bCode,
            csuSerialNo,
            verificationUrl: this.generateVerificationUrl(rcptNo),
          }
        };
      } else {
        // Update invoice as rejected
        await this.supabase
          .from('etims_invoices')
          .update({
            submission_status: 'rejected',
            submission_date: new Date().toISOString(),
            kra_response: result,
            error_message: result.resultMsg,
            retry_count: invoice.retry_count + 1,
          })
          .eq('id', invoiceId);

        return { 
          success: false, 
          message: result.resultMsg || 'Invoice submission failed' 
        };
      }
    } catch (error: any) {
      await this.logSync('submit_invoice', {}, null, 'failed', error.message, invoiceId);
      
      // Update invoice as failed
      await this.supabase
        .from('etims_invoices')
        .update({
          submission_status: 'failed',
          error_message: error.message,
          last_retry_date: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
  }

  /**
   * Build KRA OSCU compliant JSON payload
   * Standard format for Online Sales Control Unit integration
   */
  private buildOSCUPayload(invoice: any) {
    const items = invoice.items || [];

    return {
      // Branch and Tax Identification
      tin: this.config?.tin || this.config?.kra_pin,
      bhfId: this.config?.bhf_id || '00',
      
      // Invoice Information
      invcNo: invoice.invoice_number,
      orgInvcNo: null, // Original invoice for credit notes
      custTin: invoice.customer_tin || null,
      custNm: invoice.customer_name,
      
      // Sales Type Codes (OSCU Standard)
      salesTyCd: 'N', // N=Normal, P=Proforma, T=Training
      rcptTyCd: 'S', // S=Sales, R=Refund, C=Copy
      pmtTyCd: invoice.payment_method || 'Cash', // Cash, Card, Mobile, Credit
      salesSttsCd: '02', // 01=Draft, 02=Approved, 03=Cancelled
      
      // Date/Time Fields (KRA Format: YYYYMMDDHHmmss)
      cfmDt: this.formatDateTime(invoice.invoice_date),
      salesDt: this.formatDate(invoice.sale_date || invoice.invoice_date),
      stockRlsDt: this.formatDate(invoice.sale_date || invoice.invoice_date),
      cnclReqDt: null,
      cnclDt: null,
      rfdDt: null,
      rfdRsnCd: null,
      
      // Item Count
      totItemCnt: items.length,
      
      // Tax Breakdown by Category (A=16%, B=8%, C=Exempt, D=Zero-rated)
      taxblAmtA: this.calculateTaxableAmount(items, 16),
      taxblAmtB: this.calculateTaxableAmount(items, 8),
      taxblAmtC: this.calculateTaxableAmount(items, 0, 'exempt'),
      taxblAmtD: this.calculateTaxableAmount(items, 0, 'zero-rated'),
      
      taxRtA: 16,
      taxRtB: 8,
      taxRtC: 0,
      taxRtD: 0,
      
      taxAmtA: this.calculateTaxAmount(items, 16),
      taxAmtB: this.calculateTaxAmount(items, 8),
      taxAmtC: 0,
      taxAmtD: 0,
      
      // Totals
      totTaxblAmt: invoice.total_before_tax,
      totTaxAmt: invoice.vat_amount,
      totAmt: invoice.total_after_tax,
      
      // Purchaser Acceptance
      prchrAcptcYn: 'N', // Y=Yes, N=No
      
      // Remarks
      remark: invoice.notes || '',
      
      // Registrant Information (Who created/modified)
      regrId: this.config?.kra_pin,
      regrNm: this.config?.business_name,
      modrId: this.config?.kra_pin,
      modrNm: this.config?.business_name,
      
      // Item List (OSCU Standard Format)
      itemList: items.map((item: any, index: number) => ({
        itemSeq: item.item_sequence || (index + 1),
        itemCd: item.item_code || `ITM${String(index + 1).padStart(6, '0')}`,
        itemClsCd: item.item_class_code || '50201004', // KRA product classification code
        itemNm: item.item_name,
        bcd: item.barcode || null,
        pkgUnitCd: item.package_unit || 'BAG', // NT=Unit, BAG, BOX, etc.
        pkg: item.package_quantity || 1,
        qty: item.quantity,
        prc: item.unit_price,
        splyAmt: item.total_amount,
        dcRt: item.discount_rate || 0,
        dcAmt: item.discount_amount || 0,
        taxblAmt: item.total_amount - (item.discount_amount || 0),
        taxTyCd: this.determineTaxType(item.vat_rate, item.vat_category),
        taxAmt: item.vat_amount || 0,
        totAmt: (item.total_amount - (item.discount_amount || 0)) + (item.vat_amount || 0),
      })),
    };
  }

  /**
   * Calculate taxable amount for specific tax rate
   */
  private calculateTaxableAmount(items: any[], rate: number, category?: string): number {
    return items
      .filter((item: any) => {
        if (category === 'exempt') return item.vat_category === 'E';
        if (category === 'zero-rated') return item.vat_category === 'Z';
        return item.vat_rate === rate;
      })
      .reduce((sum: number, item: any) => sum + (item.total_amount - (item.discount_amount || 0)), 0);
  }

  /**
   * Calculate tax amount for specific tax rate
   */
  private calculateTaxAmount(items: any[], rate: number): number {
    return items
      .filter((item: any) => item.vat_rate === rate)
      .reduce((sum: number, item: any) => sum + (item.vat_amount || 0), 0);
  }

  /**
   * Determine tax type code based on rate and category
   */
  private determineTaxType(vatRate: number, vatCategory?: string): string {
    if (vatCategory === 'E') return 'E'; // Exempt
    if (vatCategory === 'Z') return 'D'; // Zero-rated
    if (vatRate === 16) return 'A'; // 16%
    if (vatRate === 8) return 'B'; // 8%
    return 'C'; // Other
  }

  /**
   * Generate KRA verification URL
   */
  private generateVerificationUrl(rcptNo: string | null): string {
    if (!rcptNo) return '';
    // Official KRA eTIMS receipt verification URL
    return `https://etims.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?rcptNo=${rcptNo}`;
  }

  /**
   * Format date for KRA (YYYYMMDD)
   */
  private formatDate(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Format datetime for KRA (YYYYMMDDHHmmss)
   */
  private formatDateTime(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Log API sync activity
   */
  private async logSync(
    operationType: string,
    requestPayload: any,
    responsePayload: any,
    status: 'success' | 'failed' | 'timeout' = 'success',
    errorMessage: string | null = null,
    invoiceId: string | null = null
  ) {
    try {
      await this.supabase.from('etims_sync_log').insert({
        operation_type: operationType,
        request_payload: requestPayload,
        response_payload: responsePayload,
        response_code: responsePayload?.resultCd ? parseInt(responsePayload.resultCd) : null,
        status,
        error_message: errorMessage,
        invoice_id: invoiceId,
      });
    } catch (error) {
      console.error('Failed to log sync:', error);
    }
  }
}

// Singleton instance
let etimsClient: EtimsApiClient | null = null;

export function getEtimsClient(): EtimsApiClient {
  if (!etimsClient) {
    etimsClient = new EtimsApiClient();
  }
  return etimsClient;
}
