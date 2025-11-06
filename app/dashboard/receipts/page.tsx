"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Receipt, Printer, Search, Filter, Download, Eye, FileText } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface ReceiptRecord {
  id: string;
  receipt_number: string;
  order_id: string;
  payment_id: string;
  issued_to: string;
  items: any;
  subtotal: number;
  tax: number;
  tax_rate: number;
  total: number;
  payment_method: string;
  etims_invoice_number: string | null;
  etims_verification_url: string | null;
  created_at: string;
}

export default function ReceiptsHistoryPage() {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching receipts:", error);
      } else {
        setReceipts(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.issued_to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterMethod === "all" || receipt.payment_method === filterMethod;
    return matchesSearch && matchesFilter;
  });

  const handlePrint = (receipt: ReceiptRecord) => {
    setSelectedReceipt(receipt);
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrinting(false), 500);
    }, 100);
  };

  const handleDownload = (receipt: ReceiptRecord) => {
    const items = Array.isArray(receipt.items) ? receipt.items : [];
    
    let content = `
========================================
         HARAKA POS RECEIPT
========================================
Receipt #: ${receipt.receipt_number}
Date: ${formatDate(receipt.created_at)}
Customer: ${receipt.issued_to}
Payment: ${receipt.payment_method.toUpperCase()}
${receipt.etims_invoice_number ? `eTIMS Invoice: ${receipt.etims_invoice_number}` : ''}
========================================

ITEMS
----------------------------------------
`;

    items.forEach((item: any) => {
      content += `${item.description}\n`;
      content += `  ${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.total)}\n`;
    });

    content += `
----------------------------------------
Subtotal:              ${formatCurrency(receipt.subtotal)}
Tax (${receipt.tax_rate}%):                ${formatCurrency(receipt.tax)}
----------------------------------------
TOTAL:                 ${formatCurrency(receipt.total)}
========================================

Thank you for your business!

${receipt.etims_verification_url ? `\nVerify on eTIMS:\n${receipt.etims_verification_url}` : ''}
========================================
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receipt.receipt_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Receipt className="w-8 h-8" />
          Receipt History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage all receipts with eTIMS integration
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by receipt # or customer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="md:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
              >
                <option value="all">All Payment Methods</option>
                <option value="mpesa">M-Pesa</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Total Receipts</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{filteredReceipts.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Total Value</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(filteredReceipts.reduce((sum, r) => sum + r.total, 0))}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">M-Pesa</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {filteredReceipts.filter(r => r.payment_method === 'mpesa').length}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Tax Collected</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(filteredReceipts.reduce((sum, r) => sum + r.tax, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchTerm || filterMethod !== "all" ? "No receipts match your filters" : "No receipts found"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    eTIMS
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {receipt.receipt_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {receipt.issued_to}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(receipt.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {receipt.payment_method.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(receipt.tax)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(receipt.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {receipt.etims_invoice_number ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <FileText className="w-3 h-3 mr-1" />
                          {receipt.etims_invoice_number}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedReceipt(receipt)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(receipt)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(receipt)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && !isPrinting && (
        <div className="no-print fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Receipt Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(selectedReceipt)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => handleDownload(selectedReceipt)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-6">
              <ReceiptContent receipt={selectedReceipt} />
            </div>
          </div>
        </div>
      )}

      {/* Print-only Receipt */}
      {isPrinting && selectedReceipt && (
        <div className="print-area">
          <ReceiptContent receipt={selectedReceipt} />
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}

function ReceiptContent({ receipt }: { receipt: ReceiptRecord }) {
  const items = Array.isArray(receipt.items) ? receipt.items : [];

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
        <h1 className="text-3xl font-bold text-gray-900">HARAKA POS</h1>
        <p className="text-sm text-gray-600 mt-1">Fresh Produce & Delivery</p>
        <p className="text-xs text-gray-500 mt-1">Nairobi, Kenya</p>
      </div>

      {/* Receipt Info */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Receipt #:</span>
          <span className="font-mono text-gray-900">{receipt.receipt_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Date:</span>
          <span className="text-gray-900">{formatDate(receipt.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Customer:</span>
          <span className="text-gray-900">{receipt.issued_to}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Payment:</span>
          <span className="text-gray-900 uppercase">{receipt.payment_method.replace('_', ' ')}</span>
        </div>
        {receipt.etims_invoice_number && (
          <div className="flex justify-between bg-green-50 p-2 rounded">
            <span className="font-semibold text-gray-700">eTIMS Invoice:</span>
            <span className="font-mono text-green-700">{receipt.etims_invoice_number}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 text-gray-700">Item</th>
            <th className="text-right py-2 text-gray-700">Qty</th>
            <th className="text-right py-2 text-gray-700">Price</th>
            <th className="text-right py-2 text-gray-700">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, index: number) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-3 text-gray-900">{item.description}</td>
              <td className="text-right py-3 text-gray-900">{item.quantity}</td>
              <td className="text-right py-3 text-gray-900">{formatCurrency(item.unit_price)}</td>
              <td className="text-right py-3 text-gray-900">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-lg">
          <span className="font-semibold text-gray-700">Subtotal:</span>
          <span className="text-gray-900">{formatCurrency(receipt.subtotal)}</span>
        </div>
        {receipt.tax > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Tax ({receipt.tax_rate}%):</span>
            <span className="text-gray-900">{formatCurrency(receipt.tax)}</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold border-t-2 border-gray-300 pt-2">
          <span className="text-gray-900">TOTAL:</span>
          <span className="text-gray-900">{formatCurrency(receipt.total)}</span>
        </div>
      </div>

      {/* eTIMS QR Code */}
      {receipt.etims_verification_url && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center mb-2">Verify on eTIMS:</p>
          <p className="text-xs text-center font-mono text-gray-800 break-all">{receipt.etims_verification_url}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-4">
        <p className="font-semibold">Thank you for your business!</p>
        <p className="text-xs text-gray-500 mt-2">VAT Registered | eTIMS Compliant</p>
      </div>
    </div>
  );
}
