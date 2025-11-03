"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { LogOut, Package, MapPin, Phone, User, AlertCircle } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

/**
 * Driver Dashboard Page
 * Mobile-friendly interface for drivers to view and update deliveries
 * ROLE: driver only
 */

export default function DriverPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Get the driver's name from users table
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();
      
      if (!userData?.name) {
        console.error("Driver name not found");
        setLoading(false);
        return;
      }

      // Fetch orders assigned to this driver by name
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          quantity_kg,
          total_amount,
          delivery_location,
          delivery_status,
          created_at,
          updated_at,
          customer_id,
          assigned_driver,
          customers!inner(
            id,
            name,
            phone,
            location
          )
        `)
        .eq("assigned_driver", userData.name)
        .in("delivery_status", ["Scheduled", "Pending", "On the Way", "Delivered"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching deliveries:", error);
      }

      if (data) {
        // Transform orders to match the expected delivery structure
        const transformedData = data.map((order: any) => {
          const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
          return {
            id: order.id,
            customer_name: customer?.name || "Unknown",
            customer_phone: customer?.phone || "N/A",
            location: order.delivery_location || customer?.location || "N/A",
            status: order.delivery_status,
            created_at: order.created_at,
            updated_at: order.updated_at,
            quantity_kg: order.quantity_kg,
            total_amount: order.total_amount
          };
        });
        setDeliveries(transformedData);
      }
    }
    
    setLoading(false);
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
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "On the Way":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  const pendingCount = deliveries.filter(d => d.status !== "Delivered").length;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Loading...</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">HarakaPOS Driver</h1>
            <p className="text-sm opacity-90">{userName}</p>
          </div>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit" className="text-primary bg-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Deliveries</div>
              <div className="text-2xl font-bold text-gray-900">{deliveries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">My Deliveries</h2>
          
          {loading && (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          )}

          {!loading && deliveries.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No deliveries assigned yet
              </CardContent>
            </Card>
          )}

          {!loading && deliveries.map((delivery) => (
            <Card key={delivery.id} className="border-l-4" style={{
              borderLeftColor: delivery.status === "Delivered" ? "#10b981" : 
                              delivery.status === "On the Way" ? "#3b82f6" : "#f59e0b"
            }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{delivery.customer_name}</CardTitle>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {delivery.customer_phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {delivery.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="h-4 w-4" />
                        {delivery.quantity_kg} kg - {formatCurrency(delivery.total_amount)}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(delivery.status)}`}>
                    {delivery.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500 mb-3">
                  Created: {formatDate(delivery.created_at, "time")}
                </div>
                
                {delivery.status !== "Delivered" && (
                  <div className="flex gap-2">
                    {delivery.status === "Pending" && (
                      <Button
                        onClick={() => updateStatus(delivery.id, "On the Way")}
                        className="flex-1"
                        size="sm"
                      >
                        Start Delivery
                      </Button>
                    )}
                    {delivery.status === "On the Way" && (
                      <Button
                        onClick={() => updateStatus(delivery.id, "Delivered")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                )}
                
                {delivery.status === "Delivered" && (
                  <div className="text-center text-sm text-green-600 font-medium">
                    ✓ Completed
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
