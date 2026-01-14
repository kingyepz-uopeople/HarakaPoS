"use client";

import { useState } from "react";
import { Smartphone, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface RequestPaymentButtonProps {
  orderId: string;
  amount: number;
  customerPhone: string;
  customerName: string;
  initiatedFrom: "admin" | "driver";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function RequestPaymentButton({
  orderId,
  amount,
  customerPhone,
  customerName,
  initiatedFrom,
  onSuccess,
  onError,
}: RequestPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(customerPhone);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const handleRequestPayment = async () => {
    if (!phoneNumber || phoneNumber.trim() === "") {
      alert("Please enter customer phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          phoneNumber,
          initiatedFrom,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

            alert(`Payment request sent to ${phoneNumber}\n\n${data.customerMessage}\n\nCustomer will receive a prompt to enter their M-Pesa PIN.`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Payment request error:", error);
      const errorMessage = error.message || "Failed to send payment request";
      alert(`Error: ${errorMessage}`);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!showPhoneInput ? (
        <button
          onClick={() => setShowPhoneInput(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          disabled={loading}
        >
          <Smartphone className="w-5 h-5" />
          Request M-Pesa Payment
        </button>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-green-900">M-Pesa Payment Request</h4>
            <button
              onClick={() => setShowPhoneInput(false)}
              className="text-green-600 hover:text-green-800 text-sm"
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <p className="text-gray-900">{customerName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Pay
            </label>
            <p className="text-xl font-bold text-green-600">{formatCurrency(amount)}</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678 or 254712345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter phone number in format: 0712345678 or 254712345678
            </p>
          </div>

          <button
            onClick={handleRequestPayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Send Payment Request
              </>
            )}
          </button>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
            <p className="font-medium mb-1">What happens next:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Customer receives M-Pesa prompt on their phone</li>
              <li>Customer enters their M-Pesa PIN</li>
              <li>Payment is processed instantly</li>
              <li>Receipt is auto-generated</li>
              <li>Order is marked as completed</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
