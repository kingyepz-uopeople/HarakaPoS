"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/utils/formatDate";
import type { Delivery, Sale, User } from "@/lib/types";

/**
 * Deliveries Page Component
 * Allows admin to create and manage deliveries
 */

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sale_id: "",
    driver_id: "",
    customer_name: "",
    customer_phone: "",
    location: "",
  });
  const supabase = createClient();

  // Load data on mount
  useState(() => {
    loadData();
  });

  async function loadData() {
    // Load deliveries with related data
    const { data: deliveriesData } = await supabase
      .from("deliveries")
      .select(`
        *,
        sale:sales(*),
        driver:users(*)
      `)
      .order("created_at", { ascending: false });

    if (deliveriesData) setDeliveries(deliveriesData);

    // Load sales without deliveries
    const { data: salesData } = await supabase
      .from("sales")
      .select("*")
      .order("date", { ascending: false })
      .limit(50);

    if (salesData) setSales(salesData as Sale[]);

    // Load drivers
    const { data: driversData } = await supabase
      .from("users")
      .select("*")
      .eq("role", "driver");

    if (driversData) setDrivers(driversData as User[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("deliveries").insert({
        sale_id: formData.sale_id,
        driver_id: formData.driver_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        location: formData.location,
        status: "Pending",
      });

      if (error) throw error;

      // Reset form
      setFormData({
        sale_id: "",
        driver_id: "",
        customer_name: "",
        customer_phone: "",
        location: "",
      });

      // Reload data
      loadData();
      alert("Delivery assigned successfully!");
    } catch (error: any) {
      alert("Error creating delivery: " + error.message);
    } finally {
      setLoading(false);
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
                <Select
                  id="sale"
                  value={formData.sale_id}
                  onChange={(e) => setFormData({ ...formData, sale_id: e.target.value })}
                >
                  <option value="">No Sale Linked</option>
                  {sales.slice(0, 20).map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {formatDate(sale.date)} - KES {sale.amount}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">Assign to Driver</Label>
                <Select
                  id="driver"
                  value={formData.driver_id}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                  required
                >
                  <option value="">Select Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone">Customer Phone</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  placeholder="+254 712 345 678"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Delivery Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="123 Main Street, Nairobi"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Assigning..." : "Assign Delivery"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Deliveries List */}
        <Card>
          <CardHeader>
            <CardTitle>All Deliveries</CardTitle>
            <CardDescription>Track delivery status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div className="font-medium">{delivery.customer_name}</div>
                        <div className="text-sm text-gray-500">{delivery.customer_phone}</div>
                      </TableCell>
                      <TableCell className="text-sm">{delivery.location}</TableCell>
                      <TableCell>{delivery.driver?.name || "N/A"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {deliveries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No deliveries assigned yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
