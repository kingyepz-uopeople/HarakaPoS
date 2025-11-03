"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, getTodayDate } from "@/utils/formatDate";
import type { Sale, User } from "@/lib/types";

/**
 * Sales Page Component
 * Allows admin to record sales and view sales history
 */

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "Cash" as "Cash" | "M-Pesa",
    quantity_sold: "",
    driver_id: "",
  });
  const router = useRouter();
  const supabase = createClient();

  // Load sales and drivers on mount
  useState(() => {
    loadData();
  });

  async function loadData() {
    // Load sales
    const { data: salesData } = await supabase
      .from("sales")
      .select("*")
      .order("date", { ascending: false })
      .limit(20);

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
      const { error } = await supabase.from("sales").insert({
        date: getTodayDate(),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        quantity_sold: parseFloat(formData.quantity_sold),
        driver_id: formData.driver_id || null,
      });

      if (error) throw error;

      // Reset form
      setFormData({
        amount: "",
        payment_method: "Cash",
        quantity_sold: "",
        driver_id: "",
      });

      // Reload data
      loadData();
      alert("Sale recorded successfully!");
    } catch (error: any) {
      alert("Error recording sale: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-500">Record and manage sales transactions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Sale Form */}
        <Card>
          <CardHeader>
            <CardTitle>Record New Sale</CardTitle>
            <CardDescription>Enter sale details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Sold (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={formData.quantity_sold}
                  onChange={(e) => setFormData({ ...formData, quantity_sold: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as "Cash" | "M-Pesa" })}
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">Assign to Driver (Optional)</Label>
                <Select
                  id="driver"
                  value={formData.driver_id}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                >
                  <option value="">No Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Recording..." : "Record Sale"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest 20 sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Qty (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(sale.amount)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          sale.payment_method === "M-Pesa" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {sale.payment_method}
                        </span>
                      </TableCell>
                      <TableCell>{sale.quantity_sold} kg</TableCell>
                    </TableRow>
                  ))}
                  {sales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No sales recorded yet
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
