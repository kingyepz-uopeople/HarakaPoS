"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sale, SaleWithDelivery, Customer, User, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, getTodayDate } from "@/utils/formatDate";
import { getPricePerKg } from "@/utils/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart, TrendingUp, Package } from "lucide-react";

/**
 * Sales Page Component
 * Record sales with customer selection, auto-pricing, and stock reduction
 */

export default function SalesPage() {
  const [sales, setSales] = useState<SaleWithDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pricePerKg, setPricePerKg] = useState<number>(120);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: "",
    quantity_sold: "",
    price_per_kg: "",
    total_amount: "",
    payment_method: "Cash" as PaymentMethod,
    driver_id: "",
    delivery_location: "",
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load sales with customer details
      const { data: salesData } = await supabase
        .from("sales")
        .select(`
          *,
          customer:customers(*),
          driver:users(*)
        `)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (salesData) setSales(salesData as SaleWithDelivery[]);

      // Load customers
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (customersData) setCustomers(customersData);

      // Load drivers
      const { data: driversData } = await supabase
        .from("users")
        .select("*")
        .eq("role", "driver")
        .order("name");

      if (driversData) setDrivers(driversData);

      // Load default price per kg from settings
      const defaultPrice = await getPricePerKg();
      setPricePerKg(defaultPrice);
      setFormData(prev => ({ ...prev, price_per_kg: defaultPrice.toString() }));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  // Handle quantity change and auto-calculate total
  function handleQuantityChange(quantity: string) {
    setFormData(prev => ({ ...prev, quantity_sold: quantity }));
    
    if (quantity && parseFloat(quantity) > 0 && formData.price_per_kg) {
      const total = parseFloat(quantity) * parseFloat(formData.price_per_kg);
      setFormData(prev => ({ ...prev, quantity_sold: quantity, total_amount: total.toFixed(2) }));
    }
  }

  // Handle price change and recalculate total
  function handlePriceChange(price: string) {
    setFormData(prev => ({ ...prev, price_per_kg: price }));
    
    if (price && parseFloat(price) >= 0 && formData.quantity_sold) {
      const total = parseFloat(formData.quantity_sold) * parseFloat(price);
      setFormData(prev => ({ ...prev, price_per_kg: price, total_amount: total.toFixed(2) }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Get customer details for backward compatibility
      const customer = customers.find(c => c.id === formData.customer_id);
      
      const { error } = await supabase.from("sales").insert({
        date: getTodayDate(),
        customer_id: formData.customer_id,
        customer_name: customer?.name, // For backward compatibility
        customer_phone: customer?.phone,
        quantity_sold: parseFloat(formData.quantity_sold),
        price_per_kg: parseFloat(formData.price_per_kg),
        total_amount: parseFloat(formData.total_amount),
        amount: parseFloat(formData.total_amount), // For backward compatibility
        payment_method: formData.payment_method,
        driver_id: formData.driver_id || null,
        delivery_location: formData.delivery_location || customer?.location || null,
        delivery_status: 'Pending',
      });

      if (error) throw error;

      // Reset form
      setFormData({
        customer_id: "",
        quantity_sold: "",
        price_per_kg: pricePerKg.toString(),
        total_amount: "",
        payment_method: "Cash",
        driver_id: "",
        delivery_location: "",
      });

      setShowAddModal(false);
      loadData();
      alert("Sale recorded successfully! Stock has been reduced.");
    } catch (error: any) {
      console.error("Error recording sale:", error);
      alert("Error recording sale: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats
  const stats = {
    todaySales: sales.filter(s => s.date === getTodayDate()).length,
    todayRevenue: sales
      .filter(s => s.date === getTodayDate())
      .reduce((sum, s) => sum + s.total_amount, 0),
    totalRevenue: sales.reduce((sum, s) => sum + s.total_amount, 0),
    totalQuantity: sales.reduce((sum, s) => sum + s.quantity_sold, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-500">Record sales and track revenue</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Record Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Sales</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.todaySales}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.todayRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sold</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalQuantity.toFixed(1)} kg</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Sales</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest 50 sales transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/kg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No sales recorded yet
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.customer?.name || sale.customer_name || "—"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sale.customer?.phone || sale.customer_phone || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity_sold} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sale.price_per_kg)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        sale.payment_method === "M-Pesa" 
                          ? "bg-green-100 text-green-700" 
                          : sale.payment_method === "Bank Transfer"
                          ? "bg-blue-100 text-blue-700"
                          : sale.payment_method === "Credit Card"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        sale.delivery_status === "Delivered" 
                          ? "bg-green-100 text-green-700" 
                          : sale.delivery_status === "On the Way"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {sale.delivery_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.driver?.name || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Record New Sale</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone} {customer.location && `(${customer.location})`}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Don't see the customer? <a href="/dashboard/customers" className="text-indigo-600 hover:text-indigo-500">Add them first</a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.quantity_sold}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price per kg</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price_per_kg}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="120"
                    />
                    <p className="mt-1 text-xs text-gray-500">Default: {formatCurrency(pricePerKg)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
                    placeholder="Auto-calculated"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-500">Auto-calculated: Quantity × Price per kg</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="Cash">Cash</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign Driver (Optional)</label>
                    <select
                      value={formData.driver_id}
                      onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">No driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Location (Optional)</label>
                  <input
                    type="text"
                    value={formData.delivery_location}
                    onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Westlands, Nairobi"
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  >
                    {loading ? "Recording..." : "Record Sale"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
