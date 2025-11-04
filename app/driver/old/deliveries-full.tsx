"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { 
  LogOut, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  Calendar,
  DollarSign,
  Navigation,
  ChevronRight,
  Filter
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { PaymentMethod } from "@/lib/types";

/**
 * Driver Dashboard Page - Commercial Mobile App Style
 * Mobile-first interface for drivers to manage deliveries
 * ROLE: driver only
 */

type DeliveryStatus = "Scheduled" | "Pending" | "Out for Delivery" | "Delivered" | "Completed";
type FilterType = "all" | "today" | "scheduled" | "active";

export default function DriverPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deliveryToComplete, setDeliveryToComplete] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, deliveries]);

  function applyFilter() {
    let filtered = [...deliveries];
    const today = new Date().toISOString().split('T')[0];

    switch (filter) {
      case "today":
        filtered = filtered.filter(d => d.delivery_date === today);
        break;
      case "scheduled":
        filtered = filtered.filter(d => d.status === "Scheduled" || d.status === "Pending");
        break;
      case "active":
        filtered = filtered.filter(d => d.status === "Out for Delivery");
        break;
      case "all":
      default:
        // Show all except delivered and completed
        filtered = filtered.filter(d => d.status !== "Delivered" && d.status !== "Completed");
        break;
    }

    setFilteredDeliveries(filtered);
  }

  async function checkRole() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has driver role
    const { data: userData } = await supabase
      .from("users")
      .select("role, name")
      .eq("id", user.id)
      .single();
    
    if (userData?.role !== "driver") {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    setUserName(userData.name);
    setUserId(user.id);
    loadDeliveries();
  }

  async function loadUserInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();
      
      if (userData) setUserName(userData.name);
    }
  }

  async function loadDeliveries() {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Get the driver's name from users table for display
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();
      
      if (!userData?.name) {
        console.error("Driver name not found for user:", user.id);
        setLoading(false);
        return;
      }

      console.log("Driver name:", userData.name);
      console.log("Driver ID:", user.id);

      // Fetch orders assigned to this driver by USER ID (UUID)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          quantity_kg,
          price_per_kg,
          total_price,
          delivery_date,
          delivery_time,
          delivery_status,
          created_at,
          updated_at,
          customer_id,
          assigned_driver,
          customers(
            id,
            name,
            phone,
            location
          )
        `)
        .eq("assigned_driver", user.id)  // Use user.id (UUID) instead of name
        .in("delivery_status", ["Pending", "Out for Delivery", "Delivered"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching deliveries - Raw:", error);
        console.error("Error keys:", Object.keys(error));
        console.error("Error stringified:", JSON.stringify(error, null, 2));
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Error loading deliveries:\n${error.message || 'Unknown error'}\nCode: ${error.code || 'N/A'}`);
        setLoading(false);
        return;
      }

      console.log("Fetched orders for driver:", data?.length || 0);

      if (data) {
        // Transform orders to match the expected delivery structure
        const transformedData = data.map((order: any) => {
          const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
          return {
            id: order.id,
            customer_name: customer?.name || "Unknown",
            customer_phone: customer?.phone || "N/A",
            location: customer?.location || "N/A",
            status: order.delivery_status,
            delivery_date: order.delivery_date,
            delivery_time: order.delivery_time,
            created_at: order.created_at,
            updated_at: order.updated_at,
            quantity_kg: order.quantity_kg,
            price_per_kg: order.price_per_kg,
            total_amount: order.total_price || (order.quantity_kg * order.price_per_kg)
          };
        });
        setDeliveries(transformedData);
      }
    }
    
    setLoading(false);
  }

  // Start delivery - Auto-create sale and update status
  async function startDelivery(delivery: any) {
    setSubmitting(true);
    
    try {
      // 1. Create sale automatically from order
      const saleData: any = {
        date: new Date().toISOString(),
        quantity_sold: delivery.quantity_kg,
        amount: delivery.total_amount,
        total_amount: delivery.total_amount,
        payment_method: "Cash", // Default, will be updated on completion
        order_id: delivery.id,
      };

      if (delivery.customer_id) {
        saleData.customer_id = delivery.customer_id;
      }
      if (delivery.price_per_kg) {
        saleData.price_per_kg = delivery.price_per_kg;
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) {
        console.error('Sale creation error:', saleError);
        throw new Error(saleError.message || 'Failed to create sale');
      }

      // 2. Update order status to "Out for Delivery" and link sale
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          delivery_status: "Out for Delivery",
          sale_id: sale.id,
          updated_at: new Date().toISOString() 
        })
        .eq("id", delivery.id);

      if (orderError) {
        throw new Error(orderError.message || 'Failed to update order');
      }

      // 3. Reload deliveries
      await loadDeliveries();
      alert('✅ Delivery started! Sale recorded automatically.');
    } catch (err: any) {
      alert('Error starting delivery: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Complete delivery - Show payment modal
  function openPaymentModal(delivery: any) {
    setDeliveryToComplete(delivery);
    setPaymentMethod("Cash");
    setCustomerNotes("");
    setShowPaymentModal(true);
  }

  // Confirm delivery with payment
  async function confirmDelivery() {
    if (!deliveryToComplete) return;
    
    setSubmitting(true);

    try {
      // 1. Update sale with actual payment method
      if (deliveryToComplete.sale_id) {
        const { error: saleError } = await supabase
          .from('sales')
          .update({ payment_method: paymentMethod })
          .eq('order_id', deliveryToComplete.id);

        if (saleError) {
          console.error('Sale update error:', saleError);
        }
      }

      // 2. Create delivery proof
      const { data: proof, error: proofError } = await supabase
        .from('delivery_proof')
        .insert([{
          order_id: deliveryToComplete.id,
          delivered_by: userId,
          payment_method: paymentMethod,
          payment_confirmed: true,
          customer_notes: customerNotes || null,
          delivered_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (proofError) {
        throw new Error(proofError.message || 'Failed to create delivery proof');
      }

      // 3. Update order to "Completed"
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          delivery_status: "Completed",
          delivery_proof_id: proof.id,
          updated_at: new Date().toISOString() 
        })
        .eq("id", deliveryToComplete.id);

      if (orderError) {
        throw new Error(orderError.message || 'Failed to complete order');
      }

      // 4. Close modal and reload
      setShowPaymentModal(false);
      setDeliveryToComplete(null);
      await loadDeliveries();
      alert('🎉 Delivery completed successfully!');
    } catch (err: any) {
      alert('Error completing delivery: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(deliveryId: string, newStatus: string) {
    const { error } = await supabase
      .from("orders")
      .update({ 
        delivery_status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", deliveryId);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      loadDeliveries();
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Scheduled":
        return "bg-purple-100 text-purple-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Out for Delivery":
        return "bg-blue-100 text-blue-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "Scheduled":
        return <Calendar className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Out for Delivery":
        return <Truck className="w-4 h-4" />;
      case "Delivered":
        return <Package className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  }

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === "Pending" || d.status === "Scheduled").length,
    active: deliveries.filter(d => d.status === "Out for Delivery").length,
    completed: deliveries.filter(d => d.status === "Delivered" || d.status === "Completed").length,
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-12 h-12 text-green-600 mx-auto mb-3 animate-bounce" />
          <div className="text-gray-700 font-medium">Loading deliveries...</div>
        </div>
      </div>
    );
  }

  // Show unauthorized access message
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              This page is only accessible to users with the driver role.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <form action={signOut} className="w-full">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Haraka Driver</h1>
                <p className="text-sm text-green-100">{userName}</p>
              </div>
            </div>
            <form action={signOut}>
              <Button 
                variant="outline" 
                size="sm" 
                type="submit" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-green-100">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-200">{stats.pending}</div>
              <div className="text-xs text-green-100">Pending</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-200">{stats.active}</div>
              <div className="text-xs text-green-100">Active</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-200">{stats.completed}</div>
              <div className="text-xs text-green-100">Done</div>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white border-b sticky top-[140px] z-10 shadow-sm">
        <div className="flex overflow-x-auto px-4 py-3 gap-2">
          {[
            { value: "all", label: "Active", icon: Package },
            { value: "today", label: "Today", icon: Calendar },
            { value: "scheduled", label: "Scheduled", icon: Clock },
            { value: "active", label: "En Route", icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as FilterType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === tab.value
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Deliveries List */}
      <div className="p-4 space-y-3 pb-20">
        {filteredDeliveries.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliveries</h3>
              <p className="text-gray-500">
                {filter === "all" ? "You're all caught up!" : `No ${filter} deliveries found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDeliveries.map((delivery) => (
            <Card 
              key={delivery.id} 
              className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedDelivery(selectedDelivery?.id === delivery.id ? null : delivery)}
            >
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{delivery.customer_name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        {delivery.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{delivery.location}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedDelivery?.id === delivery.id ? 'rotate-90' : ''}`} />
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">{delivery.quantity_kg} kg</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">{formatCurrency(delivery.total_amount)}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedDelivery?.id === delivery.id && (
                  <div className="border-t pt-3 mt-3 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Customer Phone</div>
                        <a href={`tel:${delivery.customer_phone}`} className="font-medium text-green-600">
                          {delivery.customer_phone}
                        </a>
                      </div>
                    </div>

                    {delivery.delivery_date && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Delivery Date</div>
                          <div className="font-medium text-gray-900">
                            {new Date(delivery.delivery_date).toLocaleDateString('en-GB', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                            {delivery.delivery_time && ` at ${delivery.delivery_time.substring(0, 5)}`}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Navigation className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Location</div>
                        <div className="font-medium text-gray-900">{delivery.location}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.location)}`, '_blank');
                        }}
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                      >
                        Navigate
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    {delivery.status !== "Delivered" && delivery.status !== "Completed" && (
                      <div className="flex gap-2 pt-2">
                        {(delivery.status === "Scheduled" || delivery.status === "Pending") && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              startDelivery(delivery);
                            }}
                            disabled={submitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:bg-gray-400"
                            size="lg"
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            {submitting ? 'Starting...' : 'Start Delivery'}
                          </Button>
                        )}
                        {delivery.status === "Out for Delivery" && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPaymentModal(delivery);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md"
                            size="lg"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Delivery
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsed Status Indicator */}
                {selectedDelivery?.id !== delivery.id && delivery.status !== "Delivered" && delivery.status !== "Completed" && (
                  <div className="text-xs text-gray-500 mt-2">
                    Tap to {delivery.status === "Out for Delivery" ? "complete" : "start"} delivery
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && deliveryToComplete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Complete Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Delivery Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="font-semibold text-gray-900">{deliveryToComplete.customer_name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {deliveryToComplete.quantity_kg} kg
                </div>
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(deliveryToComplete.total_amount)}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        paymentMethod === method
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Notes (Optional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special notes about the delivery..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setDeliveryToComplete(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelivery}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md disabled:bg-gray-400"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Delivery
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                This will mark the delivery as completed and record the payment.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
