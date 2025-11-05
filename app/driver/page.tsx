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

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          delivery_date,
          delivery_status,
          total_price,
          customers (
            name,
            location,
            phone
          )
        `)
        .eq("assigned_driver", user.id)
        .in("delivery_status", ["Pending", "Scheduled", "Out for Delivery", "Delivered"])
        .order("delivery_date", { ascending: true });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      }

      console.log("Driver ID:", user.id);
      console.log("Orders fetched:", ordersData?.length || 0);
      console.log("Orders data:", ordersData);

      if (ordersData) {
        // Map the data to ensure customers is a single object
        const mappedOrders = ordersData.map((order: any) => ({
          ...order,
          customers: Array.isArray(order.customers) ? order.customers[0] : order.customers
        }));
        setOrders(mappedOrders);
        console.log("Mapped orders:", mappedOrders.length);
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
  const completed = todayOrders.filter(o => o.delivery_status === "Delivered");
  const pending = orders.filter(o => ["Pending", "Scheduled", "Out for Delivery"].includes(o.delivery_status));

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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 mb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {driverName}!</h1>
        <p className="text-sm sm:text-base text-emerald-50">Ready to make deliveries today?</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between">{/* ... existing content ... */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Status</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {driverStatus === "available" ? "You're available for deliveries" : "You're offline"}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-colors text-sm sm:text-base ${
              driverStatus === "available"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {driverStatus === "available" ? "Available" : "Go Online"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{todayOrders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today's Deliveries</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{completed.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{pending.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
            </div>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <button
          onClick={() => router.push("/driver/deliveries")}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white rounded-2xl p-4 font-semibold shadow-lg hover:shadow-xl transition-shadow"
        >
          View {pending.length} Pending Deliver{pending.length === 1 ? "y" : "ies"}
        </button>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Deliveries</h3>
        
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No deliveries assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/driver/deliveries/${order.id}`)}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    order.delivery_status === "Delivered" ? "bg-green-100 dark:bg-green-900/30" :
                    order.delivery_status === "Out for Delivery" ? "bg-blue-100 dark:bg-blue-900/30" :
                    order.delivery_status === "Scheduled" ? "bg-purple-100 dark:bg-purple-900/30" :
                    "bg-orange-100 dark:bg-orange-900/30"
                  }`}>
                    <Package className={`w-5 h-5 ${
                      order.delivery_status === "Delivered" ? "text-green-600 dark:text-green-400" :
                      order.delivery_status === "Out for Delivery" ? "text-blue-600 dark:text-blue-400" :
                      order.delivery_status === "Scheduled" ? "text-purple-600 dark:text-purple-400" :
                      "text-orange-600 dark:text-orange-400"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{order.customers.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.customers.location}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
