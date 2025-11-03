"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getTodayDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Stock } from "@/lib/types";

/**
 * Stock Page Component
 * Allows admin to add stock and view stock history
 */

export default function StockPage() {
  const [stock, setStock] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity_kg: "",
    source: "",
    total_cost: "",
  });
  const supabase = createClient();

  // Load stock on mount
  useState(() => {
    loadStock();
  });

  async function loadStock() {
    const { data } = await supabase
      .from("stock")
      .select("*")
      .order("date", { ascending: false });

    if (data) setStock(data as Stock[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("stock").insert({
        date: getTodayDate(),
        quantity_kg: parseFloat(formData.quantity_kg),
        source: formData.source,
        total_cost: parseFloat(formData.total_cost),
      });

      if (error) throw error;

      // Reset form
      setFormData({
        quantity_kg: "",
        source: "",
        total_cost: "",
      });

      // Reload stock
      loadStock();
      alert("Stock added successfully!");
    } catch (error: any) {
      alert("Error adding stock: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Calculate total stock and costs
  const totalStock = stock.reduce((sum, item) => sum + item.quantity_kg, 0);
  const totalCost = stock.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  const avgCostPerKg = totalStock > 0 ? totalCost / totalStock : 0;

  // Calculate cost per kg for current form input (live preview)
  const currentCostPerKg = 
    formData.quantity_kg && formData.total_cost && parseFloat(formData.quantity_kg) > 0
      ? parseFloat(formData.total_cost) / parseFloat(formData.quantity_kg)
      : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
        <p className="text-gray-500">Track and manage potato inventory</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Total Stock Received</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{totalStock.toFixed(2)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Total Cost Spent</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Average Cost per Kg</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">{formatCurrency(avgCostPerKg)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Stock Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Stock</CardTitle>
            <CardDescription>Record incoming stock</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  placeholder="100"
                  value={formData.quantity_kg}
                  onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source / Supplier</Label>
                <Input
                  id="source"
                  type="text"
                  placeholder="Local Farmer / Supplier Name"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_cost">Total Cost (KES)</Label>
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  required
                />
              </div>

              {/* Live Cost per Kg Preview */}
              {currentCostPerKg > 0 && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Cost per Kg</div>
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(currentCostPerKg)}</div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Stock"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stock History */}
        <Card>
          <CardHeader>
            <CardTitle>Stock History</CardTitle>
            <CardDescription>All stock additions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Cost/Kg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell className="font-medium">{item.quantity_kg} kg</TableCell>
                      <TableCell>{item.source}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(item.total_cost || 0)}
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        {formatCurrency(item.cost_per_kg || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {stock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No stock recorded yet
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
