"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Package, CheckCircle, Clock, MapPin, ChevronRight, TrendingUp, Zap, ArrowRight } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto"></div>
            <Zap className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"></div>
        <div className="relative p-5 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome back{driverName ? `, ${driverName.split(' ')[0]}` : ''}
              </h1>
              <p className="text-emerald-50/80 text-sm sm:text-base">
                You have <span className="font-semibold text-white">{pending.length}</span> pending deliveries
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Toggle Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
              driverStatus === "available" 
                ? "bg-emerald-500" 
                : "bg-slate-100 dark:bg-slate-800"
            }`}>
                <Zap className={`w-7 h-7 transition-colors duration-300 ${
                  driverStatus === "available" ? "text-white" : "text-slate-400"
                }`} />
                {driverStatus === "available" && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Status</h3>
                <p className={`text-sm ${
                  driverStatus === "available" 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-slate-500 dark:text-slate-400"
                }`}>
                  {driverStatus === "available" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleAvailability}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                driverStatus === "available"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              {driverStatus === "available" ? "Go Offline" : "Go Online"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Package, value: todayOrders.length, label: "Today", color: "emerald" },
          { icon: CheckCircle, value: completed.length, label: "Done", color: "emerald" },
          { icon: Clock, value: pending.length, label: "Pending", color: "amber" },
          { icon: MapPin, value: orders.length, label: "Total", color: "slate" },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center mb-2`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Deliveries CTA */}
      {pending.length > 0 && (
        <button
          onClick={() => router.push("/driver/deliveries")}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl p-4 font-semibold flex items-center justify-between hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5" />
            <span>View {pending.length} Pending Deliver{pending.length === 1 ? "y" : "ies"}</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {/* Recent Deliveries */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Deliveries</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {orders.length} total
            </span>
          </div>
        </div>
        
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No deliveries assigned</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Check back later</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/driver/deliveries/${order.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        order.delivery_status === "Delivered" 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : order.delivery_status === "Out for Delivery" 
                          ? "bg-blue-100 dark:bg-blue-900/30" 
                          : "bg-amber-100 dark:bg-amber-900/30"
                      }`}>
                        <Package className={`w-5 h-5 ${
                          order.delivery_status === "Delivered" 
                            ? "text-green-600 dark:text-green-400" 
                            : order.delivery_status === "Out for Delivery" 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-amber-600 dark:text-amber-400"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{order.customers?.name || 'Unknown'}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{order.customers?.location || 'No location'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
