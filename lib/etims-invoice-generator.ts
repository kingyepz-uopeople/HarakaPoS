/**
 * eTIMS Invoice Generator
 * Automatically creates and submits tax invoices when sales are completed
 */

import { createClient } from '@/lib/supabase/client';
import { getEtimsClient } from './etims-api';

export interface CreateInvoiceParams {
  saleId: string;
  customerName?: string;
  customerTin?: string;
  notes?: string;
}

/**
 * Create eTIMS invoice from a completed sale
 */
export async function createEtimsInvoiceFromSale(
  params: CreateInvoiceParams
): Promise<{ success: boolean; message: string; invoiceId?: string }> {
  const supabase = createClient();
  const etimsClient = getEtimsClient();

  try {
    // Initialize eTIMS client
    const initialized = await etimsClient.initialize();
    if (!initialized) {
      return { success: false, message: 'eTIMS system not configured' };
    }

    const config = etimsClient.getConfig();
    if (!config || config.enabled === false) {
      return { success: false, message: 'eTIMS is disabled' };
    }

    // Get sale with items
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          products(name, sku)
        )
      `)
      .eq('id', params.saleId)
      .single();

    if (saleError || !sale) {
      return { success: false, message: 'Sale not found' };
    }

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_etims_invoice_number');

    if (!invoiceNumber) {
      return { success: false, message: 'Failed to generate invoice number' };
    }

    // Calculate VAT (Kenya standard rate is 16%)
    const vatRate = config.default_vat_rate || config.auto_submit ? 16 : 0;
    const totalBeforeTax = sale.total_amount / (1 + vatRate / 100);
    const vatAmount = sale.total_amount - totalBeforeTax;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('etims_invoices')
      .insert({
        invoice_number: invoiceNumber,
        sale_id: params.saleId,
        sale_date: sale.created_at,
        invoice_date: new Date().toISOString(),
        customer_name: params.customerName || 'Walk-in Customer',
        customer_tin: params.customerTin || null,
        total_before_tax: totalBeforeTax,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_after_tax: sale.total_amount,
        payment_method: sale.payment_method,
        submission_status: 'pending',
        notes: params.notes || null,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      return { success: false, message: 'Failed to create invoice' };
    }

    // Create invoice items
    const items = sale.items || [];
    const invoiceItems = items.map((item: any, index: number) => {
      const itemTotal = item.total_price;
      const itemBeforeTax = itemTotal / (1 + vatRate / 100);
      const itemVat = itemTotal - itemBeforeTax;

      return {
        invoice_id: invoice.id,
        item_sequence: index + 1,
        item_code: item.products?.sku || `PROD${item.product_id}`,
        item_name: item.product_name || item.products?.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: itemBeforeTax,
        vat_category: vatRate > 0 ? '50201004' : '50201005', // Standard or Exempt
        vat_rate: vatRate,
        vat_amount: itemVat,
        package_unit: 'BAG', // Default to BAG for wedges
        package_quantity: item.quantity,
      };
    });

    const { error: itemsError } = await supabase
      .from('etims_invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Rollback: delete invoice
      await supabase.from('etims_invoices').delete().eq('id', invoice.id);
      return { success: false, message: 'Failed to create invoice items' };
    }

    // Auto-submit if enabled
    const autoSubmit = config.auto_submit_invoices || config.auto_submit;
    if (autoSubmit) {
      // Check internet if required
      if (config.require_internet && !navigator.onLine) {
        // Mark for later submission
        await supabase
          .from('etims_invoices')
          .update({ submission_status: 'pending', notes: 'Waiting for internet connection' })
          .eq('id', invoice.id);

        return {
          success: true,
          message: 'Invoice created. Will submit when online.',
          invoiceId: invoice.id,
        };
      }

      // Submit to KRA
      const submitResult = await etimsClient.submitInvoice(invoice.id);

      if (submitResult.success) {
        return {
          success: true,
          message: 'Invoice created and submitted to KRA successfully',
          invoiceId: invoice.id,
        };
      } else {
        return {
          success: true,
          message: `Invoice created but submission failed: ${submitResult.message}`,
          invoiceId: invoice.id,
        };
      }
    } else {
      // Manual submission mode
      return {
        success: true,
        message: 'Invoice created. Manual submission required.',
        invoiceId: invoice.id,
      };
    }
  } catch (error: any) {
    console.error('Error creating eTIMS invoice:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Retry failed invoice submissions
 */
export async function retryFailedInvoices(): Promise<{
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const supabase = createClient();
  const etimsClient = getEtimsClient();

  try {
    // Get failed/pending invoices
    const { data: invoices, error } = await supabase
      .from('etims_invoices')
      .select('id, retry_count')
      .in('submission_status', ['pending', 'failed'])
      .lt('retry_count', 3) // Max 3 retries
      .order('created_at', { ascending: true })
      .limit(50); // Process 50 at a time

    if (error || !invoices || invoices.length === 0) {
      return { success: true, processed: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;

    for (const invoice of invoices) {
      const result = await etimsClient.submitInvoice(invoice.id);
      if (result.success) {
        succeeded++;
      } else {
        failed++;
        
        // Update retry count
        await supabase
          .from('etims_invoices')
          .update({
            retry_count: invoice.retry_count + 1,
            last_retry_date: new Date().toISOString(),
          })
          .eq('id', invoice.id);
      }
    }

    return {
      success: true,
      processed: invoices.length,
      succeeded,
      failed,
    };
  } catch (error: any) {
    console.error('Error retrying invoices:', error);
    return {
      success: false,
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
  }
}

/**
 * Get invoice QR code data for printing
 */
export async function getInvoiceQRCode(invoiceId: string): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data: invoice } = await supabase
      .from('etims_invoices')
      .select('qr_code_data, kra_verification_url')
      .eq('id', invoiceId)
      .single();

    if (!invoice) return null;

    return invoice.qr_code_data || invoice.kra_verification_url || null;
  } catch (error) {
    console.error('Error getting QR code:', error);
    return null;
  }
}
