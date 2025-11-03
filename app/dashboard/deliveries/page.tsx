"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderWithDetails, User, OrderStatus } from "@/lib/types";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { Truck, Package, MapPin, Phone, User as UserIcon, Calendar, Clock } from "lucide-react";

/**
 * Deliveries Page Component
 * Shows orders ready for delivery and allows tracking delivery status
 * Fetches from Orders table (not Sales)
 */

export default function DeliveriesPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDriver, setFilterDriver] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load orders that need delivery (Scheduled, Pending, On the Way)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          driver:users(*)
        `)
        .in("delivery_status", ["Scheduled", "Pending", "On the Way"])
        .order("delivery_date", { ascending: true })
        .order("delivery_time", { ascending: true });

      if (ordersError) throw ordersError;
      setOrders(ordersData as OrderWithDetails[] || []);

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "driver")
        .order("name");

      if (driversError) throw driversError;
      setDrivers(driversData as User[] || []);

    } catch (error: any) {
      console.error("Error loading deliveries:", error);
      alert("Error loading deliveries: " + error.message);
    } finally {
      setLoading(false);
    }
  }
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "On the Way":
        return "bg-blue-100 text-blue-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-500">Assign and track deliveries</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Delivery Form */}
        <Card>
          <CardHeader>
            <CardTitle>Assign New Delivery</CardTitle>
            <CardDescription>Create a delivery assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sale">Select Sale (Optional)</Label>

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      
      loadData();
      alert(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error.message);
    }
  }

  async function assignDriver(orderId: string, driverId: string) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ assigned_driver: driverId })
        .eq("id", orderId);

      if (error) throw error;
      
      loadData();
      alert("Driver assigned successfully!");
    } catch (error: any) {
      console.error("Error assigning driver:", error);
      alert("Error assigning driver: " + error.message);
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterDriver && order.assigned_driver !== filterDriver) return false;
    if (filterStatus !== "all" && order.delivery_status !== filterStatus) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    scheduled: orders.filter(o => o.delivery_status === "Scheduled").length,
    pending: orders.filter(o => o.delivery_status === "Pending").length,
    onTheWay: orders.filter(o => o.delivery_status === "On the Way").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading deliveries...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage order deliveries
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.scheduled}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On the Way</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.onTheWay}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Driver
            </label>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Drivers</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "all")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
              <option value="On the Way">On the Way</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No deliveries to track</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Orders will appear here when they need delivery
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.customer?.phone || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.quantity_kg} kg × {formatCurrency(order.price_per_kg)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        Total: {formatCurrency(order.total_price || (order.quantity_kg * order.price_per_kg))}
                      </div>
                      <div className="text-xs text-gray-500">{order.payment_mode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(order.delivery_date).toLocaleDateString("en-GB")}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {order.delivery_time || "No specific time"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {order.customer?.location || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.assigned_driver || ""}
                        onChange={(e) => assignDriver(order.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Assign Driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.delivery_status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          order.delivery_status === "Scheduled"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : order.delivery_status === "On the Way"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Pending">Pending</option>
                        <option value="On the Way">On the Way</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (confirm("Mark this delivery as completed?")) {
                            updateOrderStatus(order.id, "Delivered");
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
