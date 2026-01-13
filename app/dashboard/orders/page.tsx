"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderWithDetails, Customer, User, OrderStatus, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { Plus, Filter, X, Calendar, Clock, User as UserIcon, Phone, MapPin, Package, DollarSign, Truck, Link2, Copy, Share2, Navigation2 } from "lucide-react";
import { getAppSettings } from "@/utils/settings";
import OpenStreetMapLocationPicker from "@/components/OpenStreetMapLocationPicker";
import { copyTrackingUrl, shareTrackingUrl } from "@/utils/trackingUrl";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | OrderStatus>("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [pricePerKg, setPricePerKg] = useState(120);

  // Form state for adding orders
  const [formData, setFormData] = useState({
    customer_id: "",
    quantity_kg: "",
    price_per_kg: "",
    payment_mode: "Cash" as PaymentMethod,
    delivery_status: "Pending" as OrderStatus,
    delivery_date: "",
    delivery_time: "",
    delivery_notes: "",
    delivery_address: "",
    delivery_latitude: null as number | null,
    delivery_longitude: null as number | null,
    assigned_driver: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchDrivers();
    fetchPricePerKg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPricePerKg = async () => {
    const settings = await getAppSettings();
    setPricePerKg(settings.price_per_kg);
    setFormData((prev) => ({ ...prev, price_per_kg: settings.price_per_kg.toString() }));
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          driver:users(*)
        `)
        .order("delivery_date", { ascending: false })
        .order("delivery_time", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "driver")
        .order("name");

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.customer_id) {
        alert("Please select a customer");
        return;
      }
      if (!formData.quantity_kg || parseFloat(formData.quantity_kg) <= 0) {
        alert("Please enter a valid quantity");
        return;
      }
      if (!formData.delivery_date) {
        alert("Please select a delivery date");
        return;
      }

      // Prepare the order data
      // Get current user for updated_by field
      const { data: { user } } = await supabase.auth.getUser();

      const orderData = {
        customer_id: formData.customer_id,
        quantity_kg: parseFloat(formData.quantity_kg),
        price_per_kg: parseFloat(formData.price_per_kg),
        payment_mode: formData.payment_mode,
        delivery_status: formData.delivery_status,
        delivery_date: formData.delivery_date,
        delivery_time: formData.delivery_time || null,
        delivery_notes: formData.delivery_notes || null,
        delivery_address: formData.delivery_address || null,
        delivery_latitude: formData.delivery_latitude,
        delivery_longitude: formData.delivery_longitude,
        assigned_driver: formData.assigned_driver || null,
        updated_by: user?.id || null, // Track who created the order
      };

      console.log("Attempting to insert order:", orderData);

      const { data, error } = await supabase.from("orders").insert([orderData]).select();

      if (error) {
        // Log full error object as string to see everything
        console.error("Supabase error (full):", JSON.stringify(error, null, 2));
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          // Also check these alternative properties
          statusCode: (error as any).statusCode,
          status: (error as any).status,
        });
        
        const errorMsg = error.message || error.hint || "Unknown database error";
        alert(`Failed to add order: ${errorMsg}`);
        return;
      }

      // Send SMS notification - Order Confirmed
      if (data && data[0]) {
        console.log('Sending SMS for order:', data[0].id);
        fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data[0].id,
            eventType: 'order_confirmed'
          })
        })
        .then(res => res.json())
        .then(result => console.log('SMS API response:', result))
        .catch(err => console.error('SMS send failed:', err));
      }

      // Reset form and close modal
      setFormData({
        customer_id: "",
        quantity_kg: "",
        price_per_kg: pricePerKg.toString(),
        payment_mode: "Cash",
        delivery_status: "Pending",
        delivery_date: "",
        delivery_time: "",
        delivery_notes: "",
        delivery_address: "",
        delivery_latitude: null,
        delivery_longitude: null,
        assigned_driver: "",
      });
      setShowAddModal(false);
      fetchOrders();
      alert("Order added successfully!");
    } catch (error: any) {
      // Catch any unexpected errors
      console.error("Unexpected error:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error));
      
      // Try to extract message from various error formats
      let errorMessage = "Unknown error";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString) {
        errorMessage = error.toString();
      }
      
      alert(`Failed to add order: ${errorMessage}. Please try again.`);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          delivery_status: newStatus,
        })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order status:", error);
        alert(`Failed to update order status: ${error.message}`);
        return;
      }
      
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      alert(`Failed to update order status: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          assigned_driver: driverId || null,
        })
        .eq("id", orderId);

      if (error) {
        console.error("Error assigning driver:", error);
        alert(`Failed to assign driver: ${error.message}`);
        return;
      }
      
      fetchOrders();
    } catch (error: any) {
      console.error("Error assigning driver:", error);
      alert(`Failed to assign driver: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order.");
    }
  };

  // Filter orders based on selected tab and filters
  const filteredOrders = orders.filter((order) => {
    if (selectedTab !== "all" && order.delivery_status !== selectedTab) return false;
    if (filterDate && order.delivery_date !== filterDate) return false;
    if (filterDriver && order.assigned_driver !== filterDriver) return false;
    return true;
  });

  const stats = {
    scheduled: orders.filter((o) => o.delivery_status === "Scheduled").length,
    pending: orders.filter((o) => o.delivery_status === "Pending").length,
    outForDelivery: orders.filter((o) => o.delivery_status === "Out for Delivery").length,
    delivered: orders.filter((o) => o.delivery_status === "Delivered").length,
    completed: orders.filter((o) => o.delivery_status === "Completed").length,
    cancelled: orders.filter((o) => o.delivery_status === "Cancelled").length,
    totalRevenue: orders
      .filter((o) => o.delivery_status === "Completed" || o.delivery_status === "Delivered")
      .reduce((sum, o) => sum + (o.total_price || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/dashboard/track-drivers'}
            className="inline-flex items-center px-4 py-2 border border-emerald-600 rounded-md shadow-sm text-sm font-medium text-emerald-700 bg-white hover:bg-emerald-50"
          >
            <Navigation2 className="h-5 w-5 mr-2" />
            Track Drivers
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Scheduled</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.scheduled}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Out for Delivery</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.outForDelivery}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Delivered</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.delivered}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Cancelled</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.cancelled}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Revenue</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white shadow rounded-lg p-4">
        {/* Status Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedTab === "all" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setSelectedTab("Scheduled")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedTab === "Scheduled" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Scheduled ({stats.scheduled})
          </button>
          <button
            onClick={() => setSelectedTab("Pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedTab === "Pending" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setSelectedTab("Out for Delivery")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedTab === "Out for Delivery" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Out for Delivery ({stats.outForDelivery})
          </button>
          <button
            onClick={() => setSelectedTab("Delivered")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedTab === "Delivered" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Delivered ({stats.delivered})
          </button>
          <button
            onClick={() => setSelectedTab("Completed")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedTab === "Completed" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Completed ({stats.completed})
          </button>
          <button
            onClick={() => setSelectedTab("Cancelled")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedTab === "Cancelled" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Cancelled ({stats.cancelled})
          </button>
        </div>

        {/* Date and Driver Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Driver</label>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Drivers</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
          {(filterDate || filterDriver) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterDriver("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer?.name}</div>
                      <div className="text-sm text-gray-500">{order.customer?.phone}</div>
                      <div className="text-sm text-gray-500">{order.customer?.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.quantity_kg} kg × {formatCurrency(order.price_per_kg)}</div>
                      <div className="text-sm font-medium text-gray-900">Total: {formatCurrency(order.total_price || 0)}</div>
                      <div className="text-sm text-gray-500">{order.payment_mode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.delivery_date)}</div>
                      <div className="text-sm text-gray-500">{order.delivery_time || "No specific time"}</div>
                      {order.delivery_notes && (
                        <div className="text-sm text-gray-500 italic">{order.delivery_notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.assigned_driver || ""}
                        onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          !order.assigned_driver
                            ? "border-orange-300 bg-orange-50 text-orange-700 focus:ring-orange-500"
                            : "border-gray-300 bg-white text-gray-700 focus:ring-blue-500"
                        }`}
                      >
                        <option value="">{!order.assigned_driver ? "⚠️ Assign Driver" : "Unassign"}</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                      {order.driver && (
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned: {order.driver.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.delivery_status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                          order.delivery_status === "Scheduled"
                            ? "bg-gray-100 text-gray-800"
                            : order.delivery_status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.delivery_status === "Out for Delivery"
                            ? "bg-blue-100 text-blue-800"
                            : order.delivery_status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.delivery_status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Pending">Pending</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const success = await copyTrackingUrl(order.id);
                            if (success) {
                              alert('Tracking link copied to clipboard!');
                            }
                          }}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          title="Copy tracking link"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </button>
                        <button
                          onClick={async () => {
                            await shareTrackingUrl(order.id, order.customer?.name);
                          }}
                          className="inline-flex items-center px-2 py-1 border border-emerald-300 rounded-md shadow-sm text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          title="Share tracking link"
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          Share
                        </button>
                      </div>
                      {order.route_duration_minutes && (
                        <div className="text-xs text-gray-500 mt-1">
                          ETA: {order.route_duration_minutes} min
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Add New Order</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => {
                      const customerId = e.target.value;
                      const selectedCustomer = customers.find(c => c.id === customerId);
                      
                      console.log('Selected customer:', selectedCustomer);
                      
                      // Auto-populate delivery location from customer if available
                      if (selectedCustomer?.location) {
                        // Validate coordinates - must be in Kenya range approximately
                        const hasValidCoords = selectedCustomer.latitude && selectedCustomer.longitude &&
                          selectedCustomer.latitude >= -5 && selectedCustomer.latitude <= 5 &&
                          selectedCustomer.longitude >= 33 && selectedCustomer.longitude <= 42;
                        
                        console.log('Has valid coords:', hasValidCoords, selectedCustomer.latitude, selectedCustomer.longitude);
                        
                        setFormData({ 
                          ...formData, 
                          customer_id: customerId,
                          delivery_address: selectedCustomer.location,
                          delivery_latitude: hasValidCoords ? (selectedCustomer.latitude ?? null) : null,
                          delivery_longitude: hasValidCoords ? (selectedCustomer.longitude ?? null) : null,
                        });
                      } else {
                        setFormData({ ...formData, customer_id: customerId });
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity (kg)</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.quantity_kg}
                      onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price per kg</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price_per_kg}
                      onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Mode</label>
                    <select
                      value={formData.payment_mode}
                      onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as PaymentMethod })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={formData.delivery_status}
                      onChange={(e) => setFormData({ ...formData, delivery_status: e.target.value as OrderStatus })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Pending">Pending</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Date</label>
                    <input
                      type="date"
                      required
                      value={formData.delivery_date}
                      onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Time (Optional)</label>
                    <input
                      type="time"
                      value={formData.delivery_time}
                      onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delivery Location
                  </label>
                  {formData.delivery_address && formData.customer_id && (
                    <div className={`mb-2 p-2 border rounded-md flex items-start gap-2 ${
                      formData.delivery_latitude && formData.delivery_longitude
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}>
                      <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        formData.delivery_latitude && formData.delivery_longitude
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`} />
                      <p className={`text-sm ${
                        formData.delivery_latitude && formData.delivery_longitude
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {formData.delivery_latitude && formData.delivery_longitude
                          ? '✅ Location auto-filled from customer profile with coordinates. You can change it below if needed.'
                          : '⚠️ Address auto-filled but coordinates are missing. Please paste a Google Maps link or use "Show Map" to set the exact location.'
                        }
                      </p>
                    </div>
                  )}
                  <OpenStreetMapLocationPicker
                    value={
                      formData.delivery_address
                        ? {
                            address: formData.delivery_address,
                            latitude: formData.delivery_latitude || 0,
                            longitude: formData.delivery_longitude || 0,
                          }
                        : undefined
                    }
                    onChange={(location) => {
                      if (location) {
                        setFormData({
                          ...formData,
                          delivery_address: location.address,
                          delivery_latitude: location.latitude,
                          delivery_longitude: location.longitude,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          delivery_address: "",
                          delivery_latitude: null,
                          delivery_longitude: null,
                        });
                      }
                    }}
                    placeholder="Search for delivery address in Kenya..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Driver (Optional)</label>
                  <select
                    value={formData.assigned_driver}
                    onChange={(e) => setFormData({ ...formData, assigned_driver: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Not assigned</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.delivery_notes}
                    onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    Add Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
