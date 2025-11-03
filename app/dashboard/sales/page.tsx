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
import { getPricePerKg } from "@/utils/settings";
import type { Sale, User } from "@/lib/types";

/**
 * Sales Page Component
 * Allows admin to record sales and view sales history
 */

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pricePerKg, setPricePerKg] = useState<number>(120);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "Cash" as "Cash" | "M-Pesa",
    quantity_sold: "",
    driver_id: "",
    customer_name: "",
    customer_phone: "",
    delivery_location: "",
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

    // Load price per kg from settings
    const defaultPrice = await getPricePerKg();
    setPricePerKg(defaultPrice);
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
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || null,
        delivery_location: formData.delivery_location || null,
        delivery_status: 'Pending',
      });

      if (error) throw error;

      // Reset form
      setFormData({
        amount: "",
        payment_method: "Cash",
        quantity_sold: "",
        driver_id: "",
        customer_name: "",
        customer_phone: "",
        delivery_location: "",
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

  // Handle quantity change and auto-calculate amount
  function handleQuantityChange(quantity: string) {
    setFormData({ ...formData, quantity_sold: quantity });
    
    if (!useCustomPrice && quantity && parseFloat(quantity) > 0) {
      const calculatedAmount = parseFloat(quantity) * pricePerKg;
      setFormData(prev => ({ ...prev, quantity_sold: quantity, amount: calculatedAmount.toFixed(2) }));
    }
  }

  // Handle manual amount change (custom pricing)
  function handleAmountChange(amount: string) {
    setFormData({ ...formData, amount });
    setUseCustomPrice(true);
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
                <Label htmlFor="customer_phone">Customer Phone (Optional)</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  placeholder="+254712345678"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
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
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Default price: {formatCurrency(pricePerKg)}/kg
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Total Amount (KES)</Label>
                  {useCustomPrice && (
                    <span className="text-xs text-orange-600 font-medium">Custom Price</span>
                  )}
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Auto-calculated"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  {!useCustomPrice ? "Auto-calculated from quantity × price/kg" : "Manual override active"}
                </p>
              </div>

              {/* Live Price per Kg Preview */}
              {formData.quantity_sold && formData.amount && parseFloat(formData.quantity_sold) > 0 && (
                <div className="p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Actual Price per Kg</div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(parseFloat(formData.amount) / parseFloat(formData.quantity_sold))}
                  </div>
                  {useCustomPrice && (
                    <div className="text-xs text-orange-600 mt-1">
                      Differs from default: {formatCurrency(pricePerKg)}/kg
                    </div>
                  )}
                </div>
              )}

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

              <div className="space-y-2">
                <Label htmlFor="delivery_location">Delivery Location (Optional)</Label>
                <Input
                  id="delivery_location"
                  type="text"
                  placeholder="e.g., Westlands, Nairobi"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                />
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
