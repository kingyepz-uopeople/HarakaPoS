"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Package, CheckCircle, Clock, MapPin, ChevronRight } from "lucide-react";

interface Order {
  id: string;
  delivery_date: string;
  delivery_status: string;
  total_price: number;
  customers: {
    name: string;
    location: string;
    phone_number: string;
  };
}

export default function DriverDashboard() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverStatus, setDriverStatus] = useState<string>("offline");
  const [driverName, setDriverName] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (userData) {
        setDriverName(userData.full_name || "Driver");
      }

      const { data: statusData } = await supabase
        .from("driver_status")
        .select("status")
        .eq("driver_id", user.id)
        .single();

      if (statusData) {
        setDriverStatus(statusData.status || "offline");
      }

      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id,
          delivery_date,
          delivery_status,
          total_price,
          customers (
            name,
            location,
            phone_number
          )
        `)
        .eq("assigned_driver", user.id)
        .in("delivery_status", ["Pending", "Out for Delivery", "Delivered"])
        .order("delivery_date", { ascending: true });

      if (ordersData) {
        // Map the data to ensure customers is a single object
        const mappedOrders = ordersData.map((order: any) => ({
          ...order,
          customers: Array.isArray(order.customers) ? order.customers[0] : order.customers
        }));
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = driverStatus === "available" ? "offline" : "available";

      await supabase
        .from("driver_status")
        .upsert({
          driver_id: user.id,
          status: newStatus,
          updated_at: new Date().toISOString()
        });

      setDriverStatus(newStatus);
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(o => o.delivery_date === todayStr);
  const completed = todayOrders.filter(o => o.delivery_status === "Completed");
  const pending = orders.filter(o => ["Pending", "Out for Delivery"].includes(o.delivery_status));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 mb-20">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {driverName}!</h1>
        <p className="text-emerald-50">Ready to make deliveries today?</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Status</h3>
            <p className="text-sm text-gray-500">
              {driverStatus === "available" ? "You're available for deliveries" : "You're offline"}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              driverStatus === "available"
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {driverStatus === "available" ? "Available" : "Go Online"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
              <p className="text-xs text-gray-500">Today's Deliveries</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <button
          onClick={() => router.push("/driver/deliveries")}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-4 font-semibold shadow-lg"
        >
          View {pending.length} Pending Deliver{pending.length === 1 ? "y" : "ies"}
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Deliveries</h3>
        
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No deliveries assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/driver/deliveries/${order.id}`)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    order.delivery_status === "Completed" ? "bg-green-100" :
                    order.delivery_status === "Out for Delivery" ? "bg-blue-100" :
                    "bg-orange-100"
                  }`}>
                    <Package className={`w-5 h-5 ${
                      order.delivery_status === "Completed" ? "text-green-600" :
                      order.delivery_status === "Out for Delivery" ? "text-blue-600" :
                      "text-orange-600"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.customers.name}</p>
                    <p className="text-sm text-gray-500">{order.customers.location}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
