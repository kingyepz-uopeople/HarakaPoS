'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getEtimsClient } from '@/lib/etims-api';
import { retryFailedInvoices } from '@/lib/etims-invoice-generator';
import EtimsReceipt from '@/components/etims/EtimsReceipt';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Send,
  AlertTriangle
} from 'lucide-react';

export default function EtimsInvoicesPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<any>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('etims_invoices')
        .select(`
          *,
          sale:sales(
            id,
            quantity_sold,
            customer:customers(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInvoice = async (invoiceId: string) => {
    setSubmitting(invoiceId);
    try {
      const etimsClient = getEtimsClient();
      const result = await etimsClient.submitInvoice(invoiceId);

      if (result.success) {
                alert('Invoice submitted to KRA successfully');
        fetchInvoices();
      } else {
                alert(`Submission failed: ${result.message}`);
      }
        } catch (error: any) {
      console.error('Error submitting invoice:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(null);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      const result = await retryFailedInvoices();
      setRetryResult(result);
      
            if (result.success) {
        alert(`Retry complete:\n${result.succeeded} succeeded\n${result.failed} failed`);
        fetchInvoices();
      } else {
        alert('Retry process failed');
      }
        } catch (error: any) {
      console.error('Error retrying invoices:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setRetrying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            <CheckCircle size={14} />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
            <Clock size={14} />
            Pending
          </span>
        );
      case 'failed':
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
            <XCircle size={14} />
            {status === 'failed' ? 'Failed' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const pendingCount = invoices.filter(inv => inv.submission_status === 'pending').length;
  const failedCount = invoices.filter(inv => ['failed', 'rejected'].includes(inv.submission_status)).length;

  if (viewingReceipt) {
    return (
      <div className="p-6">
        <button
          onClick={() => setViewingReceipt(null)}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Back to Invoices
        </button>
        <EtimsReceipt saleId={viewingReceipt} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">eTIMS Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and submit tax invoices to KRA</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRetryFailed}
            disabled={retrying || (pendingCount === 0 && failedCount === 0)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
            Retry Failed ({pendingCount + failedCount})
          </button>

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Retry Result */}
      {retryResult && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-medium text-blue-900">
            Retry Complete: {retryResult.processed} invoices processed
          </p>
          <p className="text-sm text-blue-700 mt-1">
            {retryResult.succeeded} succeeded | {retryResult.failed} failed
          </p>
        </div>
      )}

      {/* Warning for pending/failed */}
      {(pendingCount > 0 || failedCount > 0) && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 mt-1" size={20} />
          <div>
            <p className="font-medium text-yellow-900">Action Required</p>
            <p className="text-sm text-yellow-700 mt-1">
              You have {pendingCount} pending and {failedCount} failed invoices that need to be submitted to KRA.
            </p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                VAT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No invoices found. Invoices are created automatically when sales are completed.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                    {invoice.kra_invoice_number && (
                      <div className="text-xs text-gray-500">KRA: {invoice.kra_invoice_number}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.customer_name}</div>
                    {invoice.customer_tin && (
                      <div className="text-xs text-gray-500">TIN: {invoice.customer_tin}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {invoice.total_before_tax.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {invoice.vat_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    KSh {invoice.total_after_tax.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.submission_status)}
                    {invoice.retry_count > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Retried {invoice.retry_count}x
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingReceipt(invoice.sale_id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Receipt"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {['pending', 'failed', 'rejected'].includes(invoice.submission_status) && (
                        <button
                          onClick={() => handleSubmitInvoice(invoice.id)}
                          disabled={submitting === invoice.id}
                          className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                          title="Submit to KRA"
                        >
                          <Send size={18} className={submitting === invoice.id ? 'animate-pulse' : ''} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Error Messages */}
      {invoices.filter(inv => inv.error_message).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Errors</h3>
          <div className="space-y-2">
            {invoices
              .filter(inv => inv.error_message)
              .slice(0, 5)
              .map((invoice) => (
                <div key={invoice.id} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <span className="font-medium">{invoice.invoice_number}:</span> {invoice.error_message}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
