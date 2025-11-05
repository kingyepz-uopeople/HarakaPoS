"use client";"use client";"use client";



import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { useRouter } from "next/navigation";import { useEffect, useState } from "react";import { useState, useEffect } from "react";

import { Package, CheckCircle, Clock, MapPin, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/client";import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Order {

  id: string;import { formatCurrency } from "@/utils/formatCurrency";import { Button } from "@/components/ui/button";

  delivery_date: string;

  delivery_status: string;import Link from "next/link";import { createClient } from "@/lib/supabase/client";

  total_price: number;

  customers: {import { import { formatCurrency } from "@/utils/formatCurrency";

    name: string;

    location: string;  Package, import { formatDate } from "@/utils/formatDate";

    phone_number: string;

  };  CheckCircle2, import { 

}

  Clock,   LogOut, 

export default function DriverDashboard() {

  const router = useRouter();  TrendingUp,   Package, 

  const supabase = createClient();

    MapPin,  MapPin, 

  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);  Phone,  Phone, 

  const [driverStatus, setDriverStatus] = useState<string>("offline");

  const [driverName, setDriverName] = useState<string>("");  ChevronRight,  User, 



  useEffect(() => {  Truck  AlertCircle,

    loadData();

  }, []);} from "lucide-react";  CheckCircle,



  async function loadData() {  Clock,

    try {

      setLoading(true);interface DashboardStats {  Truck,



      // Get current user  todayDeliveries: number;  Calendar,

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {  completedToday: number;  DollarSign,

        router.push("/login");

        return;  pendingDeliveries: number;  Navigation,

      }

  todayEarnings: number;  ChevronRight,

      // Get driver's profile data

      const { data: userData } = await supabase}  Filter

        .from("profiles")

        .select("full_name")} from "lucide-react";

        .eq("id", user.id)

        .single();interface RecentDelivery {import { signOut } from "@/app/actions/auth";



      if (userData) {  id: string;import { useRouter } from "next/navigation";

        setDriverName(userData.full_name || "Driver");

      }  customer_name: string;import { PaymentMethod } from "@/lib/types";



      // Get driver status  customer_phone: string;

      const { data: statusData } = await supabase

        .from("driver_status")  location: string;/**

        .select("status")

        .eq("driver_id", user.id)  status: string; * Driver Dashboard Page - Commercial Mobile App Style

        .single();

  total_amount: number; * Mobile-first interface for drivers to manage deliveries

      if (statusData) {

        setDriverStatus(statusData.status || "offline");  delivery_time: string; * ROLE: driver only

      }

} */

      // Get today's orders for this driver

      const today = new Date().toISOString().split("T")[0];

      

      const { data: ordersData } = await supabaseexport default function DriverDashboard() {type DeliveryStatus = "Scheduled" | "Pending" | "Out for Delivery" | "Delivered" | "Completed";

        .from("orders")

        .select(`  const [stats, setStats] = useState<DashboardStats>({type FilterType = "all" | "today" | "scheduled" | "active";

          id,

          delivery_date,    todayDeliveries: 0,

          delivery_status,

          total_price,    completedToday: 0,export default function DriverPage() {

          customers (

            name,    pendingDeliveries: 0,  const [deliveries, setDeliveries] = useState<any[]>([]);

            location,

            phone_number    todayEarnings: 0,  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([]);

          )

        `)  });  const [loading, setLoading] = useState(true);

        .eq("assigned_driver", user.id)

        .in("delivery_status", ["Pending", "Out for Delivery", "Delivered"])  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([]);  const [userName, setUserName] = useState("");

        .order("delivery_date", { ascending: true });

  const [loading, setLoading] = useState(true);  const [userId, setUserId] = useState("");

      if (ordersData) {

        setOrders(ordersData);  const [driverStatus, setDriverStatus] = useState<'available' | 'busy' | 'offline'>('offline');  const [authorized, setAuthorized] = useState(false);

      }

    } catch (error) {  const supabase = createClient();  const [filter, setFilter] = useState<FilterType>("all");

      console.error("Error loading data:", error);

    } finally {  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

      setLoading(false);

    }  useEffect(() => {  const [showPaymentModal, setShowPaymentModal] = useState(false);

  }

    loadDashboard();  const [deliveryToComplete, setDeliveryToComplete] = useState<any>(null);

  async function toggleAvailability() {

    try {  }, []);  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;  const [customerNotes, setCustomerNotes] = useState("");



      const newStatus = driverStatus === "available" ? "offline" : "available";  async function loadDashboard() {  const [submitting, setSubmitting] = useState(false);



      await supabase    try {  const supabase = createClient();

        .from("driver_status")

        .upsert({      const { data: { user } } = await supabase.auth.getUser();  const router = useRouter();

          driver_id: user.id,

          status: newStatus,      if (!user) return;

          updated_at: new Date().toISOString()

        });  useEffect(() => {



      setDriverStatus(newStatus);      // Get today's date range    checkRole();

    } catch (error) {

      console.error("Error toggling status:", error);      const today = new Date();    // eslint-disable-next-line react-hooks/exhaustive-deps

    }

  }      today.setHours(0, 0, 0, 0);  }, []);



  // Calculate stats      const todayStr = today.toISOString().split('T')[0];

  const todayStr = new Date().toISOString().split("T")[0];

  const todayOrders = orders.filter(o => o.delivery_date === todayStr);  useEffect(() => {

  const completed = todayOrders.filter(o => o.delivery_status === "Completed");

  const pending = orders.filter(o => ["Pending", "Out for Delivery"].includes(o.delivery_status));      // Fetch all deliveries for the driver    applyFilter();



  if (loading) {      const { data: orders } = await supabase    // eslint-disable-next-line react-hooks/exhaustive-deps

    return (

      <div className="flex items-center justify-center min-h-screen">        .from("orders")  }, [filter, deliveries]);

        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>        .select(`

          <p className="text-gray-600">Loading dashboard...</p>

        </div>          *,  function applyFilter() {

      </div>

    );          customers (    let filtered = [...deliveries];

  }

            name,    const today = new Date().toISOString().split('T')[0];

  return (

    <div className="p-4 space-y-6 mb-20">            phone,

      {/* Header */}

      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">            location    switch (filter) {

        <h1 className="text-2xl font-bold mb-2">Welcome back, {driverName}!</h1>

        <p className="text-emerald-50">Ready to make deliveries today?</p>          )      case "today":

      </div>

        `)        filtered = filtered.filter(d => d.delivery_date === today);

      {/* Availability Toggle */}

      <div className="bg-white rounded-2xl shadow-sm p-4">        .eq("assigned_driver", user.id)        break;

        <div className="flex items-center justify-between">

          <div>        .gte("delivery_date", todayStr)      case "scheduled":

            <h3 className="font-semibold text-gray-900">Status</h3>

            <p className="text-sm text-gray-500">        .order("created_at", { ascending: false });        filtered = filtered.filter(d => d.status === "Scheduled" || d.status === "Pending");

              {driverStatus === "available" ? "You're available for deliveries" : "You're offline"}

            </p>        break;

          </div>

          <button      if (orders) {      case "active":

            onClick={toggleAvailability}

            className={`px-6 py-3 rounded-full font-medium transition-colors ${        // Calculate stats        filtered = filtered.filter(d => d.status === "Out for Delivery");

              driverStatus === "available"

                ? "bg-emerald-500 text-white"        const todayOrders = orders.filter(o => o.delivery_date === todayStr);        break;

                : "bg-gray-200 text-gray-700"

            }`}        const completed = todayOrders.filter(o => o.delivery_status === 'Completed');      case "all":

          >

            {driverStatus === "available" ? "Available" : "Go Online"}        const pending = orders.filter(o =>       default:

          </button>

        </div>          ['Pending', 'Out for Delivery'].includes(o.delivery_status)        // Show all except delivered and completed

      </div>

        );        filtered = filtered.filter(d => d.status !== "Delivered" && d.status !== "Completed");

      {/* Stats Grid */}

      <div className="grid grid-cols-2 gap-4">        const earnings = completed.reduce((sum, o) => sum + (o.total_price || 0), 0);        break;

        <div className="bg-white rounded-2xl shadow-sm p-4">

          <div className="flex items-center space-x-3 mb-2">    }

            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">

              <Package className="w-5 h-5 text-blue-600" />        setStats({

            </div>

            <div>          todayDeliveries: todayOrders.length,    setFilteredDeliveries(filtered);

              <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>

              <p className="text-xs text-gray-500">Today's Deliveries</p>          completedToday: completed.length,  }

            </div>

          </div>          pendingDeliveries: pending.length,

        </div>

          todayEarnings: earnings,  async function checkRole() {

        <div className="bg-white rounded-2xl shadow-sm p-4">

          <div className="flex items-center space-x-3 mb-2">        });    const { data: { user } } = await supabase.auth.getUser();

            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">

              <CheckCircle className="w-5 h-5 text-green-600" />    

            </div>

            <div>        // Transform recent deliveries    if (!user) {

              <p className="text-2xl font-bold text-gray-900">{completed.length}</p>

              <p className="text-xs text-gray-500">Completed</p>        const recent = orders.slice(0, 5).map(order => {      router.push("/login");

            </div>

          </div>          const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;      return;

        </div>

          return {    }

        <div className="bg-white rounded-2xl shadow-sm p-4">

          <div className="flex items-center space-x-3 mb-2">            id: order.id,

            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">

              <Clock className="w-5 h-5 text-orange-600" />            customer_name: customer?.name || "Unknown",    // Check if user has driver role

            </div>

            <div>            customer_phone: customer?.phone || "N/A",    const { data: userData } = await supabase

              <p className="text-2xl font-bold text-gray-900">{pending.length}</p>

              <p className="text-xs text-gray-500">Pending</p>            location: customer?.location || "N/A",      .from("users")

            </div>

          </div>            status: order.delivery_status,      .select("role, name")

        </div>

            total_amount: order.total_price || 0,      .eq("id", user.id)

        <div className="bg-white rounded-2xl shadow-sm p-4">

          <div className="flex items-center space-x-3 mb-2">            delivery_time: order.delivery_time || "Not set",      .single();

            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">

              <MapPin className="w-5 h-5 text-purple-600" />          };    

            </div>

            <div>        });    if (userData?.role !== "driver") {

              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>

              <p className="text-xs text-gray-500">Total Orders</p>        setRecentDeliveries(recent);      setAuthorized(false);

            </div>

          </div>      }      setLoading(false);

        </div>

      </div>      return;



      {/* Quick Action */}      // Get driver status    }

      {pending.length > 0 && (

        <button      const { data: statusData } = await supabase

          onClick={() => router.push("/driver/deliveries")}

          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-4 font-semibold shadow-lg"        .from("driver_status")    setAuthorized(true);

        >

          View {pending.length} Pending Deliver{pending.length === 1 ? "y" : "ies"}        .select("status")    setUserName(userData.name);

        </button>

      )}        .eq("driver_id", user.id)    setUserId(user.id);



      {/* Recent Deliveries */}        .single();    loadDeliveries();

      <div className="bg-white rounded-2xl shadow-sm p-4">

        <h3 className="font-semibold text-gray-900 mb-4">Recent Deliveries</h3>        }

        

        {orders.length === 0 ? (      if (statusData) {

          <div className="text-center py-8">

            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />        setDriverStatus(statusData.status);  async function loadUserInfo() {

            <p className="text-gray-500">No deliveries assigned yet</p>

          </div>      }    const { data: { user } } = await supabase.auth.getUser();

        ) : (

          <div className="space-y-3">    if (user) {

            {orders.slice(0, 5).map((order) => (

              <div    } catch (error) {      const { data: userData } = await supabase

                key={order.id}

                onClick={() => router.push(`/driver/deliveries/${order.id}`)}      console.error("Error loading dashboard:", error);        .from("users")

                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"

              >    } finally {        .select("name")

                <div className="flex items-center space-x-3">

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${      setLoading(false);        .eq("id", user.id)

                    order.delivery_status === "Completed" ? "bg-green-100" :

                    order.delivery_status === "Out for Delivery" ? "bg-blue-100" :    }        .single();

                    "bg-orange-100"

                  }`}>  }      

                    <Package className={`w-5 h-5 ${

                      order.delivery_status === "Completed" ? "text-green-600" :      if (userData) setUserName(userData.name);

                      order.delivery_status === "Out for Delivery" ? "text-blue-600" :

                      "text-orange-600"  async function toggleAvailability() {    }

                    }`} />

                  </div>    try {  }

                  <div>

                    <p className="font-medium text-gray-900">{order.customers.name}</p>      const { data: { user } } = await supabase.auth.getUser();

                    <p className="text-sm text-gray-500">{order.customers.location}</p>

                  </div>      if (!user) return;  async function loadDeliveries() {

                </div>

                <ChevronRight className="w-5 h-5 text-gray-400" />    setLoading(true);

              </div>

            ))}      const newStatus = driverStatus === 'available' ? 'offline' : 'available';    

          </div>

        )}    const { data: { user } } = await supabase.auth.getUser();

      </div>

    </div>      const { error } = await supabase    

  );

}        .from("driver_status")    if (user) {


        .upsert({      // Get the driver's name from users table for display

          driver_id: user.id,      const { data: userData } = await supabase

          status: newStatus,        .from("users")

          last_updated: new Date().toISOString(),        .select("name")

        });        .eq("id", user.id)

        .single();

      if (!error) {      

        setDriverStatus(newStatus);      if (!userData?.name) {

      }        console.error("Driver name not found for user:", user.id);

    } catch (error) {        setLoading(false);

      console.error("Error updating status:", error);        return;

    }      }

  }

      console.log("Driver name:", userData.name);

  function getStatusBadge(status: string) {      console.log("Driver ID:", user.id);

    const styles = {

      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',      // Fetch orders assigned to this driver by USER ID (UUID)

      'Out for Delivery': 'bg-blue-100 text-blue-800 border-blue-200',      const { data, error } = await supabase

      'Delivered': 'bg-green-100 text-green-800 border-green-200',        .from("orders")

      'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',        .select(`

      'Cancelled': 'bg-red-100 text-red-800 border-red-200',          id,

    };          quantity_kg,

    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';          price_per_kg,

  }          total_price,

          delivery_date,

  if (loading) {          delivery_time,

    return (          delivery_status,

      <div className="flex items-center justify-center min-h-[60vh]">          created_at,

        <div className="text-center">          updated_at,

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>          customer_id,

          <p className="mt-4 text-gray-600">Loading dashboard...</p>          assigned_driver,

        </div>          customers(

      </div>            id,

    );            name,

  }            phone,

            location

  return (          )

    <div className="p-4 space-y-6">        `)

      {/* Availability Toggle */}        .eq("assigned_driver", user.id)  // Use user.id (UUID) instead of name

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">        .in("delivery_status", ["Pending", "Out for Delivery", "Delivered"])

        <div className="flex items-center justify-between">        .order("created_at", { ascending: false });

          <div className="flex items-center space-x-3">

            <div className={`w-3 h-3 rounded-full ${      if (error) {

              driverStatus === 'available' ? 'bg-green-500' :         console.error("Error fetching deliveries - Raw:", error);

              driverStatus === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'        console.error("Error keys:", Object.keys(error));

            } animate-pulse`}></div>        console.error("Error stringified:", JSON.stringify(error, null, 2));

            <div>        console.error("Error details:", {

              <p className="text-sm font-medium text-gray-900">          message: error.message,

                {driverStatus === 'available' ? 'You are Available' :          details: error.details,

                 driverStatus === 'busy' ? 'On Delivery' : 'You are Offline'}          hint: error.hint,

              </p>          code: error.code

              <p className="text-xs text-gray-500">        });

                {driverStatus === 'available' ? 'Ready for deliveries' :        alert(`Error loading deliveries:\n${error.message || 'Unknown error'}\nCode: ${error.code || 'N/A'}`);

                 driverStatus === 'busy' ? 'Currently delivering' : 'Not accepting deliveries'}        setLoading(false);

              </p>        return;

            </div>      }

          </div>

          {driverStatus !== 'busy' && (      console.log("Fetched orders for driver:", data?.length || 0);

            <button

              onClick={toggleAvailability}      if (data) {

              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${        // Transform orders to match the expected delivery structure

                driverStatus === 'available'        const transformedData = data.map((order: any) => {

                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'          const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;

                  : 'bg-emerald-600 text-white hover:bg-emerald-700'          return {

              }`}            id: order.id,

            >            customer_name: customer?.name || "Unknown",

              {driverStatus === 'available' ? 'Go Offline' : 'Go Online'}            customer_phone: customer?.phone || "N/A",

            </button>            location: customer?.location || "N/A",

          )}            status: order.delivery_status,

        </div>            delivery_date: order.delivery_date,

      </div>            delivery_time: order.delivery_time,

            created_at: order.created_at,

      {/* Stats Grid */}            updated_at: order.updated_at,

      <div className="grid grid-cols-2 gap-4">            quantity_kg: order.quantity_kg,

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">            price_per_kg: order.price_per_kg,

          <div className="flex items-center justify-between mb-2">            total_amount: order.total_price || (order.quantity_kg * order.price_per_kg)

            <Package className="w-8 h-8 opacity-80" />          };

          </div>        });

          <p className="text-2xl font-bold">{stats.todayDeliveries}</p>        setDeliveries(transformedData);

          <p className="text-sm opacity-90">Today's Deliveries</p>      }

        </div>    }

    

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">    setLoading(false);

          <div className="flex items-center justify-between mb-2">  }

            <CheckCircle2 className="w-8 h-8 opacity-80" />

          </div>  // Start delivery - Auto-create sale and update status

          <p className="text-2xl font-bold">{stats.completedToday}</p>  async function startDelivery(delivery: any) {

          <p className="text-sm opacity-90">Completed</p>    setSubmitting(true);

        </div>    

    try {

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg">      // 1. Create sale automatically from order

          <div className="flex items-center justify-between mb-2">      const saleData: any = {

            <Clock className="w-8 h-8 opacity-80" />        date: new Date().toISOString(),

          </div>        quantity_sold: delivery.quantity_kg,

          <p className="text-2xl font-bold">{stats.pendingDeliveries}</p>        amount: delivery.total_amount,

          <p className="text-sm opacity-90">Pending</p>        total_amount: delivery.total_amount,

        </div>        payment_method: "Cash", // Default, will be updated on completion

        order_id: delivery.id,

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">      };

          <div className="flex items-center justify-between mb-2">

            <TrendingUp className="w-8 h-8 opacity-80" />      if (delivery.customer_id) {

          </div>        saleData.customer_id = delivery.customer_id;

          <p className="text-2xl font-bold">{formatCurrency(stats.todayEarnings)}</p>      }

          <p className="text-sm opacity-90">Today's Earnings</p>      if (delivery.price_per_kg) {

        </div>        saleData.price_per_kg = delivery.price_per_kg;

      </div>      }



      {/* Quick Actions */}      const { data: sale, error: saleError } = await supabase

      {stats.pendingDeliveries > 0 && (        .from('sales')

        <Link        .insert([saleData])

          href="/driver/deliveries"        .select()

          className="block bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"        .single();

        >

          <div className="flex items-center justify-between">      if (saleError) {

            <div>        console.error('Sale creation error:', saleError);

              <p className="text-sm opacity-90">Ready to deliver?</p>        throw new Error(saleError.message || 'Failed to create sale');

              <p className="text-xl font-bold mt-1">      }

                {stats.pendingDeliveries} {stats.pendingDeliveries === 1 ? 'delivery' : 'deliveries'} waiting

              </p>      // 2. Update order status to "Out for Delivery" and link sale

            </div>      const { error: orderError } = await supabase

            <Truck className="w-12 h-12 opacity-80" />        .from("orders")

          </div>        .update({ 

        </Link>          delivery_status: "Out for Delivery",

      )}          sale_id: sale.id,

          updated_at: new Date().toISOString() 

      {/* Recent Deliveries */}        })

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">        .eq("id", delivery.id);

        <div className="p-4 border-b border-gray-100 flex items-center justify-between">

          <h2 className="font-semibold text-gray-900">Recent Deliveries</h2>      if (orderError) {

          <Link         throw new Error(orderError.message || 'Failed to update order');

            href="/driver/deliveries"      }

            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"

          >      // 3. Reload deliveries

            View All      await loadDeliveries();

          </Link>      alert('✅ Delivery started! Sale recorded automatically.');

        </div>    } catch (err: any) {

      alert('Error starting delivery: ' + err.message);

        {recentDeliveries.length === 0 ? (    } finally {

          <div className="p-8 text-center">      setSubmitting(false);

            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />    }

            <p className="text-gray-500">No deliveries yet</p>  }

            <p className="text-sm text-gray-400 mt-1">Your deliveries will appear here</p>

          </div>  // Complete delivery - Show payment modal

        ) : (  function openPaymentModal(delivery: any) {

          <div className="divide-y divide-gray-100">    setDeliveryToComplete(delivery);

            {recentDeliveries.map((delivery) => (    setPaymentMethod("Cash");

              <Link    setCustomerNotes("");

                key={delivery.id}    setShowPaymentModal(true);

                href={`/driver/deliveries/${delivery.id}`}  }

                className="block p-4 hover:bg-gray-50 transition-colors"

              >  // Confirm delivery with payment

                <div className="flex items-start justify-between">  async function confirmDelivery() {

                  <div className="flex-1">    if (!deliveryToComplete) return;

                    <div className="flex items-center space-x-2 mb-2">    

                      <h3 className="font-medium text-gray-900">{delivery.customer_name}</h3>    setSubmitting(true);

                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(delivery.status)}`}>

                        {delivery.status}    try {

                      </span>      // 1. Update sale with actual payment method

                    </div>      if (deliveryToComplete.sale_id) {

                            const { error: saleError } = await supabase

                    <div className="space-y-1 text-sm text-gray-600">          .from('sales')

                      <div className="flex items-center space-x-2">          .update({ payment_method: paymentMethod })

                        <MapPin className="w-4 h-4" />          .eq('order_id', deliveryToComplete.id);

                        <span>{delivery.location}</span>

                      </div>        if (saleError) {

                      <div className="flex items-center space-x-2">          console.error('Sale update error:', saleError);

                        <Phone className="w-4 h-4" />        }

                        <span>{delivery.customer_phone}</span>      }

                      </div>

                      {delivery.delivery_time && (      // 2. Create delivery proof

                        <div className="flex items-center space-x-2">      const { data: proof, error: proofError } = await supabase

                          <Clock className="w-4 h-4" />        .from('delivery_proof')

                          <span>{delivery.delivery_time}</span>        .insert([{

                        </div>          order_id: deliveryToComplete.id,

                      )}          delivered_by: userId,

                    </div>          payment_method: paymentMethod,

                  </div>          payment_confirmed: true,

                            customer_notes: customerNotes || null,

                  <div className="text-right ml-4">          delivered_at: new Date().toISOString()

                    <p className="text-lg font-bold text-gray-900">{formatCurrency(delivery.total_amount)}</p>        }])

                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-1" />        .select()

                  </div>        .single();

                </div>

              </Link>      if (proofError) {

            ))}        throw new Error(proofError.message || 'Failed to create delivery proof');

          </div>      }

        )}

      </div>      // 3. Update order to "Completed"

    </div>      const { error: orderError } = await supabase

  );        .from("orders")

}        .update({ 

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
