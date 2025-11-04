"use client";

import { useState } from "react";
import { Printer, Banknote, Smartphone, Check, X, Receipt } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface PDAPaymentFlowProps {
  orderId: string;
  amount: number;
  customerName: string;
  onComplete: () => void;
}

export default function PDAPaymentFlow({
  orderId,
  amount,
  customerName,
  onComplete,
}: PDAPaymentFlowProps) {
  const [step, setStep] = useState<"select" | "cash" | "mpesa" | "processing">("select");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [printing, setPrinting] = useState(false);

  const handlePaymentMethodSelect = (method: "cash" | "mpesa") => {
    setPaymentMethod(method);
    setStep(method);
  };

  const handleCashPayment = async () => {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < amount) {
      alert(`Cash received must be at least ${formatCurrency(amount)}`);
      return;
    }

    setStep("processing");
    await processPayment("cash", cashReceived);
  };

  const handleMpesaPayment = async () => {
    if (!mpesaCode || mpesaCode.trim().length < 8) {
      alert("Please enter a valid M-Pesa confirmation code (e.g., ABC123DEFG)");
      return;
    }

    setStep("processing");
    await processPayment("mpesa", mpesaCode);
  };

  const processPayment = async (method: "cash" | "mpesa", reference: string) => {
    try {
      // 1. Record payment
      const response = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          paymentMethod: method,
          reference, // Cash amount or M-Pesa code
          initiatedFrom: "driver",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      // 2. Print receipt to PDA
      await printReceiptToPDA(data.receiptId);

      // 3. Show success
      alert(`✅ Payment received!\n\nReceipt printed to PDA terminal.`);
      
      onComplete();
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(`❌ Error: ${error.message}`);
      setStep("select");
    }
  };

  const printReceiptToPDA = async (receiptId: string) => {
    setPrinting(true);
    
    try {
      // Call PDA printer API
      const response = await fetch("/api/print/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId }),
      });

      if (!response.ok) {
        throw new Error("Failed to print receipt");
      }

      // In real implementation, this would:
      // - Connect to PDA via Bluetooth/USB
      // - Format receipt for thermal printer
      // - Send ESC/POS commands
      // - Print the receipt
      
    } catch (error) {
      console.error("Print error:", error);
      alert("⚠️ Payment recorded but printing failed. You can reprint from order details.");
    } finally {
      setPrinting(false);
    }
  };

  const getChange = () => {
    const received = parseFloat(cashReceived);
    return received - amount;
  };

  if (step === "processing") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="mb-4">
          <Printer className="w-16 h-16 mx-auto text-blue-600 animate-bounce" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
        {printing && <p className="text-sm text-gray-600">Printing receipt to PDA terminal...</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Collect Payment</h2>
        <p className="text-emerald-100">Customer: {customerName}</p>
        <p className="text-3xl font-bold mt-2">{formatCurrency(amount)}</p>
      </div>

      {/* Payment Method Selection */}
      {step === "select" && (
        <div className="p-6 space-y-4">
          <p className="text-gray-700 font-medium mb-4">How is the customer paying?</p>
          
          <button
            onClick={() => handlePaymentMethodSelect("cash")}
            className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-600 text-green-900 p-6 rounded-xl transition-all active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-600 p-3 rounded-full">
                <Banknote className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold">Cash Payment</p>
                <p className="text-sm text-green-700">Receive cash from customer</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </button>

          <button
            onClick={() => handlePaymentMethodSelect("mpesa")}
            className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-600 text-blue-900 p-6 rounded-xl transition-all active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold">M-Pesa Payment</p>
                <p className="text-sm text-blue-700">Customer pays via M-Pesa on PDA</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </button>
        </div>
      )}

      {/* Cash Payment Flow */}
      {step === "cash" && (
        <div className="p-6 space-y-4">
          <button
            onClick={() => setStep("select")}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4"
          >
            ← Back
          </button>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Banknote className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-green-900">Cash Payment</h3>
            </div>
            <p className="text-sm text-green-800">Amount due: {formatCurrency(amount)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cash Received (KES)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-bold px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              autoFocus
            />
          </div>

          {cashReceived && parseFloat(cashReceived) >= amount && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-1">Change to return:</p>
              <p className="text-3xl font-bold text-yellow-900">
                {formatCurrency(getChange())}
              </p>
            </div>
          )}

          <button
            onClick={handleCashPayment}
            disabled={!cashReceived || parseFloat(cashReceived) < amount}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" />
            Confirm Cash Payment
          </button>
        </div>
      )}

      {/* M-Pesa Payment Flow */}
      {step === "mpesa" && (
        <div className="p-6 space-y-4">
          <button
            onClick={() => setStep("select")}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4"
          >
            ← Back
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-blue-900">M-Pesa Payment</h3>
            </div>
            
            <div className="bg-white rounded p-3 space-y-2 text-sm">
              <p className="font-medium text-gray-900">📱 On the PDA terminal:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Open M-Pesa app/menu</li>
                <li>Select "Lipa na M-Pesa"</li>
                <li>Enter amount: <span className="font-bold">{formatCurrency(amount)}</span></li>
                <li>Customer enters their PIN</li>
                <li>Get confirmation code</li>
              </ol>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              M-Pesa Confirmation Code
            </label>
            <input
              type="text"
              value={mpesaCode}
              onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
              placeholder="e.g., SH12ABC3DEF"
              className="w-full text-xl font-mono px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              maxLength={15}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the M-Pesa confirmation code shown on PDA screen
            </p>
          </div>

          <button
            onClick={handleMpesaPayment}
            disabled={!mpesaCode || mpesaCode.length < 8}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" />
            Confirm M-Pesa Payment
          </button>
        </div>
      )}

      {/* Instructions at bottom */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 text-center text-sm text-gray-600">
        <Receipt className="w-5 h-5 mx-auto mb-1 text-gray-400" />
        Receipt will print automatically to PDA terminal
      </div>
    </div>
  );
}
