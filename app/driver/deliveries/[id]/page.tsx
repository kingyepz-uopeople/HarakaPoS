"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { PaymentMethod } from "@/lib/types";
import PDAPaymentFlow from "@/components/PDAPaymentFlow";
import {
  MapPin,
  Phone,
  Clock,
  Package,
  Navigation,
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Truck
} from "lucide-react";

export default function DeliveryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [customerNotes, setCustomerNotes] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      loadDelivery(params.id as string);
    }
  }, [params.id]);

  async function loadDelivery(id: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            name,
            phone,
            location
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
        setDelivery({
          ...data,
          customer_name: customer?.name || "Unknown",
          customer_phone: customer?.phone || "N/A",
          location: customer?.location || "N/A",
        });
      }
    } catch (error) {
      console.error("Error loading delivery:", error);
    } finally {
      setLoading(false);
    }
  }

  async function startDelivery() {
    if (!delivery) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create sale automatically
      const saleData = {
        date: new Date().toISOString(),
        quantity_sold: delivery.quantity_kg,
        price_per_kg: delivery.price_per_kg,
        amount: delivery.total_price,
        total_amount: delivery.total_price,
        payment_method: "Cash" as PaymentMethod,
        customer_id: delivery.customer_id,
        order_id: delivery.id,
      };

      const { error: saleError } = await supabase.from("sales").insert([saleData]);
      if (saleError) {
        console.error("Error creating sale:", saleError);
        throw new Error(`Failed to create sale: ${saleError.message}`);
      }

      // 2. Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ delivery_status: "Out for Delivery" })
        .eq("id", delivery.id);

      if (orderError) throw orderError;

      alert("Delivery started successfully!");
      router.push("/driver/deliveries");
    } catch (error: any) {
      console.error("Error starting delivery:", error);
      alert("Error starting delivery: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelivery() {
    if (!delivery) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Update sale with payment method
      const { error: saleError } = await supabase
        .from("sales")
        .update({ payment_method: paymentMethod })
        .eq("order_id", delivery.id);

      if (saleError) throw saleError;

      // 2. Create delivery proof
      const proofData = {
        order_id: delivery.id,
        delivered_by: user.id,
        payment_method: paymentMethod,
        customer_notes: customerNotes,
        payment_confirmed: true,
      };

      const { error: proofError } = await supabase
        .from("delivery_proof")
        .insert([proofData]);

      if (proofError) throw proofError;

      // 3. Update order status to Completed
      const { error: orderError } = await supabase
        .from("orders")
        .update({ delivery_status: "Completed" })
        .eq("id", delivery.id);

      if (orderError) throw orderError;

      alert("Delivery completed successfully!");
      setShowPaymentModal(false);
      router.push("/driver/deliveries");
    } catch (error: any) {
      console.error("Error completing delivery:", error);
      alert("Error completing delivery: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openNavigation() {
    if (!delivery) return;
    const encodedLocation = encodeURIComponent(delivery.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  }

  function getStatusColor(status: string) {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Out for Delivery': 'bg-blue-100 text-blue-800 border-blue-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery not found</h3>
          <button
            onClick={() => router.push("/driver/deliveries")}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back to Deliveries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.push("/driver/deliveries")}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Delivery Details</h1>
      </div>

      {/* Status Badge */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(delivery.delivery_status)}`}>
          {delivery.delivery_status}
        </span>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Customer Information</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{delivery.customer_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <a href={`tel:${delivery.customer_phone}`} className="font-medium text-emerald-600 hover:text-emerald-700">
                {delivery.customer_phone}
              </a>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{delivery.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Order Details</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Quantity</span>
            </div>
            <span className="font-medium text-gray-900">{delivery.quantity_kg} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Total Amount</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">{formatCurrency(delivery.total_price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Delivery Date</span>
            </div>
            <span className="font-medium text-gray-900">{delivery.delivery_date}</span>
          </div>
          {delivery.delivery_time && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Delivery Time</span>
              </div>
              <span className="font-medium text-gray-900">{delivery.delivery_time}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 sticky bottom-20 pb-4">
        {/* Navigate Button - Always visible */}
        <button
          onClick={openNavigation}
          className="w-full bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 py-4 px-4 rounded-xl text-base font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <Navigation className="w-5 h-5" />
          <span>Navigate to Location</span>
        </button>

        {/* Start Delivery Button */}
        {(delivery.delivery_status === "Pending" || delivery.delivery_status === "Scheduled") && (
          <button
            onClick={startDelivery}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 py-4 px-4 rounded-xl text-base font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Truck className="w-5 h-5" />
            <span>{submitting ? "Starting..." : "Start Delivery"}</span>
          </button>
        )}

        {/* Payment Collection - Only when Out for Delivery */}
        {delivery.delivery_status === "Out for Delivery" && (
          <>
            {/* PDA Payment Collection */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Collect Payment on PDA</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use your PDA terminal to process M-Pesa or accept cash
                </p>
              </div>
              <PDAPaymentFlow
                orderId={delivery.id}
                amount={delivery.total_price || (delivery.quantity_kg * delivery.price_per_kg)}
                customerName={delivery.customer_name}
                onComplete={() => {
                  router.push("/driver/deliveries");
                }}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center space-x-3 my-2">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm font-medium text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* M-Pesa STK Push (Coming Soon) */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Send M-Pesa Request
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  M-Pesa STK Push integration coming soon
                </p>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Customer:</strong> {delivery.customer_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Phone:</strong> {delivery.customer_phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Delivery</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Notes (Optional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special notes or feedback from customer..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={submitting}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelivery}
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
