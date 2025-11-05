/**
 * eTIMS API Client for Kenya Revenue Authority
 * Handles all communication with KRA eTIMS system
 */

import { createClient } from '@/lib/supabase/client';
import { EtimsConfig, EtimsInvoice, EtimsInvoiceItem } from './types';

export class EtimsApiClient {
  private config: EtimsConfig | null = null;
  private supabase = createClient();

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
   * Initialize device with KRA
   * Must be done once before submitting invoices
   */
  async initializeDevice(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) {
      await this.initialize();
    }

    if (!this.config) {
      return { success: false, message: 'eTIMS not configured' };
    }

    if (!this.config.cu_serial_number) {
      return { success: false, message: 'Control Unit serial number not set' };
    }

    try {
      const endpoint = `${this.config.api_base_url}/initializer/selectInitInfo`;
      
      const requestData = {
        tin: this.config.tin || this.config.kra_pin,
        bhfId: this.config.bhf_id || '00',
        dvcSrlNo: this.config.cu_serial_number,
      };

      // Log request
      await this.logSync('device_init', requestData, null);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      // Log response
      await this.logSync('device_init', requestData, result);

      if (result.resultCd === '000') {
        // Update config status
        await this.supabase
          .from('etims_config')
          .update({
            cu_status: 'active',
            device_initialization_date: new Date().toISOString(),
          })
          .eq('id', this.config.id);

        return { 
          success: true, 
          message: 'Device initialized successfully',
          data: result.data 
        };
      } else {
        return { 
          success: false, 
          message: result.resultMsg || 'Device initialization failed' 
        };
      }
    } catch (error: any) {
      await this.logSync('device_init', {}, null, 'failed', error.message);
      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
  }

  /**
   * Submit invoice to KRA
   */
  async submitInvoice(invoiceId: string): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) {
      await this.initialize();
    }

    if (!this.config) {
      return { success: false, message: 'eTIMS not configured' };
    }

    if (this.config.cu_status !== 'active') {
      return { success: false, message: 'Device not initialized. Please initialize first.' };
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

      // Build KRA request
      const requestData = this.buildInvoiceRequest(invoice);

      const endpoint = `${this.config.api_base_url}/trnsSales/saveSales`;

      // Log request
      await this.logSync('submit_invoice', requestData, null, 'success', null, invoiceId);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      // Log response
      await this.logSync('submit_invoice', requestData, result, 'success', null, invoiceId);

      if (result.resultCd === '000') {
        // Update invoice with KRA response
        await this.supabase
          .from('etims_invoices')
          .update({
            submission_status: 'approved',
            submission_date: new Date().toISOString(),
            kra_response: result,
            kra_invoice_number: result.data?.rcptNo || result.data?.invoiceNo,
            kra_verification_url: this.generateVerificationUrl(result.data?.rcptNo),
            qr_code_data: this.generateQRCodeData(invoice, result.data),
            receipt_signature: result.data?.rcptSign,
            signature_date: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        return { 
          success: true, 
          message: 'Invoice submitted successfully',
          data: result.data 
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
   * Build KRA invoice request payload
   */
  private buildInvoiceRequest(invoice: any) {
    const items = invoice.items || [];

    return {
      tin: this.config?.tin || this.config?.kra_pin,
      bhfId: this.config?.bhf_id || '00',
      invcNo: invoice.invoice_number,
      orgInvcNo: null,
      custTin: invoice.customer_tin || null,
      custNm: invoice.customer_name,
      salesTyCd: 'N', // Normal sale
      rcptTyCd: 'S', // Sales receipt
      pmtTyCd: 'Cash', // Payment type
      salesSttsCd: '02', // Approved
      cfmDt: this.formatDateTime(invoice.invoice_date),
      salesDt: this.formatDate(invoice.sale_date),
      stockRlsDt: this.formatDate(invoice.sale_date),
      cnclReqDt: null,
      cnclDt: null,
      rfdDt: null,
      rfdRsnCd: null,
      totItemCnt: items.length,
      taxblAmtA: invoice.vat_rate > 0 ? invoice.total_before_tax : 0, // Taxable amount
      taxblAmtB: 0,
      taxblAmtC: 0,
      taxblAmtD: 0,
      taxRtA: invoice.vat_rate, // 16% or 0%
      taxRtB: 0,
      taxRtC: 0,
      taxRtD: 0,
      taxAmtA: invoice.vat_amount,
      taxAmtB: 0,
      taxAmtC: 0,
      taxAmtD: 0,
      totTaxblAmt: invoice.total_before_tax,
      totTaxAmt: invoice.vat_amount,
      totAmt: invoice.total_after_tax,
      prchrAcptcYn: 'N',
      remark: invoice.notes || '',
      regrId: this.config?.kra_pin,
      regrNm: this.config?.business_name,
      modrId: this.config?.kra_pin,
      modrNm: this.config?.business_name,
      itemList: items.map((item: any, index: number) => ({
        itemSeq: item.item_sequence || index + 1,
        itemCd: item.item_code || `ITEM${String(index + 1).padStart(3, '0')}`,
        itemClsCd: item.vat_category || '50201004', // Default product code
        itemNm: item.item_name,
        bcd: null, // Barcode
        pkgUnitCd: item.package_unit || 'BAG',
        pkg: item.package_quantity || item.quantity,
        qty: item.quantity,
        prc: item.unit_price,
        splyAmt: item.total_amount,
        dcRt: 0, // Discount rate
        dcAmt: 0, // Discount amount
        taxblAmt: item.total_amount,
        taxTyCd: item.vat_rate > 0 ? 'A' : 'E', // A=16%, E=Exempt
        taxAmt: item.vat_amount,
        totAmt: item.total_amount + item.vat_amount,
      })),
    };
  }

  /**
   * Generate QR code data for receipt
   */
  private generateQRCodeData(invoice: any, kraResponse: any): string {
    const verificationUrl = this.generateVerificationUrl(kraResponse?.rcptNo);
    
    // KRA QR format: URL with invoice details
    const qrData = {
      url: verificationUrl,
      invoiceNo: invoice.invoice_number,
      rcptNo: kraResponse?.rcptNo,
      date: invoice.invoice_date,
      total: invoice.total_after_tax,
      tin: this.config?.tin || this.config?.kra_pin,
    };

    return JSON.stringify(qrData);
  }

  /**
   * Generate KRA verification URL
   */
  private generateVerificationUrl(rcptNo: string | null): string {
    if (!rcptNo) return '';
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
