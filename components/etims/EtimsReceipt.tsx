'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import EtimsQRCode from './EtimsQRCode';
import { formatCurrency } from '@/lib/utils';

interface EtimsReceiptProps {
  saleId: string;
  onPrint?: () => void;
}

interface ReceiptData {
  sale: any;
  invoice: any;
  config: any;
}

/**
 * eTIMS-compliant receipt component
 * Displays full tax invoice with KRA verification details
 */
export default function EtimsReceipt({ saleId, onPrint }: EtimsReceiptProps) {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReceiptData();
  }, [saleId]);

  const fetchReceiptData = async () => {
    setLoading(true);
    try {
      // Get sale with items
      const { data: sale } = await supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          ),
          user:users(full_name)
        `)
        .eq('id', saleId)
        .single();

      // Get eTIMS invoice
      const { data: invoice } = await supabase
        .from('etims_invoices')
        .select(`
          *,
          items:etims_invoice_items(*)
        `)
        .eq('sale_id', saleId)
        .single();

      // Get eTIMS config
      const { data: config } = await supabase
        .from('etims_config')
        .select('*')
        .limit(1)
        .single();

      setData({ sale, invoice, config });
    } catch (error) {
      console.error('Error fetching receipt data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || !data.sale) {
    return (
      <div className="p-4 text-center text-gray-500">
        Receipt not found
      </div>
    );
  }

  const { sale, invoice, config } = data;
  const hasEtims = invoice && invoice.submission_status === 'approved';

  return (
    <div className="max-w-md mx-auto bg-white">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-area,
          .receipt-print-area * {
            visibility: visible;
          }
          .receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print mb-4 text-center">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Receipt
        </button>
      </div>

      {/* Receipt content */}
      <div className="receipt-print-area p-4 border border-gray-300" style={{ width: '58mm', fontFamily: 'monospace' }}>
        {/* Header */}
        <div className="text-center mb-4 border-b-2 border-black pb-2">
          <h1 className="text-xl font-bold">{config?.business_name || 'HARAKA WEDGES SUPPLIES'}</h1>
          {config?.business_address && (
            <p className="text-xs">{config.business_address}</p>
          )}
          {config?.business_phone && (
            <p className="text-xs">Tel: {config.business_phone}</p>
          )}
          {config?.kra_pin && (
            <p className="text-xs font-bold">KRA PIN: {config.kra_pin}</p>
          )}
        </div>

        {/* Invoice details */}
        {hasEtims && (
          <div className="mb-4 text-xs border-b border-dashed border-gray-400 pb-2">
            <p className="font-bold">TAX INVOICE</p>
            <p>Invoice No: {invoice.invoice_number}</p>
            {invoice.kra_invoice_number && (
              <p>KRA No: {invoice.kra_invoice_number}</p>
            )}
            <p>Date: {new Date(invoice.invoice_date).toLocaleString()}</p>
            {invoice.customer_name !== 'Walk-in Customer' && (
              <>
                <p>Customer: {invoice.customer_name}</p>
                {invoice.customer_tin && <p>Customer TIN: {invoice.customer_tin}</p>}
              </>
            )}
          </div>
        )}

        {/* Receipt number (non-eTIMS) */}
        {!hasEtims && (
          <div className="mb-4 text-xs border-b border-dashed border-gray-400 pb-2">
            <p>Receipt No: #{sale.id.slice(0, 8)}</p>
            <p>Date: {new Date(sale.created_at).toLocaleString()}</p>
            <p>Cashier: {sale.user?.full_name || 'Unknown'}</p>
          </div>
        )}

        {/* Items */}
        <div className="mb-4 text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="py-1">{item.product_name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right font-bold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-4 text-xs border-t-2 border-black pt-2">
          {hasEtims ? (
            <>
              <div className="flex justify-between py-1">
                <span>Subtotal (excl. VAT):</span>
                <span className="font-bold">{formatCurrency(invoice.total_before_tax)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>VAT ({invoice.vat_rate}%):</span>
                <span className="font-bold">{formatCurrency(invoice.vat_amount)}</span>
              </div>
              <div className="flex justify-between py-1 text-base border-t border-gray-400 mt-1 pt-1">
                <span className="font-bold">TOTAL:</span>
                <span className="font-bold">{formatCurrency(invoice.total_after_tax)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 text-base">
              <span className="font-bold">TOTAL:</span>
              <span className="font-bold">{formatCurrency(sale.total_amount)}</span>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="mb-4 text-xs border-b border-dashed border-gray-400 pb-2">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-bold uppercase">{sale.payment_method}</span>
          </div>
        </div>

        {/* eTIMS QR Code */}
        {hasEtims && invoice.qr_code_data && (
          <div className="mb-4 flex flex-col items-center border-b border-dashed border-gray-400 pb-2">
            <p className="text-xs font-bold mb-2">SCAN TO VERIFY</p>
            <EtimsQRCode data={invoice.qr_code_data} size={120} />
            <p className="text-xs mt-2 text-center">
              Verify this invoice at etims.kra.go.ke
            </p>
            {invoice.receipt_signature && (
              <p className="text-xs mt-1 break-all">
                Signature: {invoice.receipt_signature.slice(0, 20)}...
              </p>
            )}
          </div>
        )}

        {/* eTIMS status */}
        {invoice && (
          <div className="mb-4 text-xs border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between items-center">
              <span>eTIMS Status:</span>
              <span className={`font-bold uppercase ${
                invoice.submission_status === 'approved' ? 'text-green-600' :
                invoice.submission_status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {invoice.submission_status}
              </span>
            </div>
            {invoice.submission_status === 'pending' && (
              <p className="text-xs text-gray-600 mt-1">
                Will be submitted to KRA when online
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs mt-4 border-t border-gray-400 pt-2">
          <p className="font-bold">Thank you for your business!</p>
          <p className="mt-1">Goods once sold are not returnable</p>
          {config?.receipt_footer_message && (
            <p className="mt-1">{config.receipt_footer_message}</p>
          )}
          <p className="mt-2 text-xs text-gray-600">
            Powered by HarakaPOS
          </p>
        </div>
      </div>
    </div>
  );
}
