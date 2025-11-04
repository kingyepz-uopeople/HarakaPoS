"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Receipt as ReceiptType } from "@/lib/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { Download, Printer, Mail } from "lucide-react";

interface ReceiptViewerProps {
  orderId: string;
  paymentId?: string;
}

export default function ReceiptViewer({ orderId, paymentId }: ReceiptViewerProps) {
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentId]);

  const fetchReceipt = async () => {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching receipt:", error);
      } else {
        setReceipt(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable version
    const printContent = document.getElementById("receipt-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt?.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 600px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            .info { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
            .total { font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="text-center py-8">Loading receipt...</div>;
  }

  if (!receipt) {
    return (
      <div className="text-center py-8 text-gray-500">
        No receipt generated yet
      </div>
    );
  }

  const items = typeof receipt.items === 'string' 
    ? JSON.parse(receipt.items) 
    : receipt.items;

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Receipt content */}
      <div id="receipt-content" className="bg-white border border-gray-300 rounded-lg p-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">HARAKA POS</h1>
          <p className="text-sm text-gray-600">Processed Potatoes Supplier</p>
          <p className="text-sm text-gray-600">Nairobi, Kenya</p>
          <p className="text-sm text-gray-600">Tel: +254 XXX XXX XXX</p>
        </div>

        {/* Receipt info */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Receipt No:</span>
            <span className="font-mono">{receipt.receipt_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{formatDate(receipt.created_at || new Date().toISOString())}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Customer:</span>
            <span>{receipt.issued_to}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Payment Method:</span>
            <span className="uppercase">{receipt.payment_method}</span>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2">Item</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3">{item.description}</td>
                <td className="text-right py-3">{item.quantity}</td>
                <td className="text-right py-3">{formatCurrency(item.unit_price)}</td>
                <td className="text-right py-3">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Subtotal:</span>
            <span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          {receipt.tax && receipt.tax > 0 && (
            <div className="flex justify-between">
              <span className="font-semibold">Tax:</span>
              <span>{formatCurrency(receipt.tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold border-t-2 border-gray-300 pt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-4">
          <p className="font-semibold">Thank you for your business!</p>
          <p className="mt-2">For any queries, please contact us at info@harakapos.co.ke</p>
        </div>
      </div>
    </div>
  );
}
