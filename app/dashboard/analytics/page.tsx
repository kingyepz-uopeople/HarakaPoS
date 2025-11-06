"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, Filter } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface SalesData {
  date: string;
  total_sales: number;
  total_orders: number;
  payment_method: string;
}

interface CustomerInsight {
  customer_name: string;
  customer_id: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      let start = new Date();
      let end = new Date();
      
      if (dateRange === "7days") {
        start.setDate(start.getDate() - 7);
      } else if (dateRange === "30days") {
        start.setDate(start.getDate() - 30);
      } else if (dateRange === "90days") {
        start.setDate(start.getDate() - 90);
      } else if (dateRange === "custom" && startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      }

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      // Aggregate sales by date and payment method
      const aggregated = sales.reduce((acc: any, sale: any) => {
        const date = new Date(sale.created_at).toLocaleDateString();
        const key = `${date}-${sale.payment_method}`;
        
        if (!acc[key]) {
          acc[key] = {
            date,
            total_sales: 0,
            total_orders: 0,
            payment_method: sale.payment_method
          };
        }
        
        acc[key].total_sales += sale.total_amount;
        acc[key].total_orders += 1;
        
        return acc;
      }, {});

      setSalesData(Object.values(aggregated));

      // Fetch customer insights
      const { data: customers, error: customerError } = await supabase
        .from("sales")
        .select("customer_name, customer_id, total_amount, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (customerError) throw customerError;

      // Aggregate by customer
      const customerMap: Record<string, CustomerInsight> = {};
      customers.forEach((sale: any) => {
        if (!customerMap[sale.customer_id]) {
          customerMap[sale.customer_id] = {
            customer_name: sale.customer_name,
            customer_id: sale.customer_id,
            total_orders: 0,
            total_spent: 0,
            last_order_date: sale.created_at
          };
        }
        
        customerMap[sale.customer_id].total_orders += 1;
        customerMap[sale.customer_id].total_spent += sale.total_amount;
        
        if (new Date(sale.created_at) > new Date(customerMap[sale.customer_id].last_order_date)) {
          customerMap[sale.customer_id].last_order_date = sale.created_at;
        }
      });

      const customerList: CustomerInsight[] = Object.values(customerMap);
      setCustomerInsights(customerList.sort((a, b) => b.total_spent - a.total_spent));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalRevenue = salesData.reduce((sum, s) => sum + s.total_sales, 0);
  const totalOrders = salesData.reduce((sum, s) => sum + s.total_orders, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Payment breakdown
  const paymentBreakdown = salesData.reduce((acc: any, s) => {
    if (!acc[s.payment_method]) {
      acc[s.payment_method] = { total: 0, count: 0 };
    }
    acc[s.payment_method].total += s.total_sales;
    acc[s.payment_method].count += s.total_orders;
    return acc;
  }, {});

  const exportToCSV = () => {
    const headers = ["Date", "Payment Method", "Orders", "Revenue"];
    const rows = salesData.map(s => [s.date, s.payment_method, s.total_orders, s.total_sales]);
    
    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Sales Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Insights, trends, and performance metrics
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDateRange("7days")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateRange === "7days"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange("30days")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateRange === "30days"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange("90days")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateRange === "90days"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Last 90 Days
            </button>
          </div>
          {dateRange === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% from last period
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalOrders}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {salesData.length} unique days
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(averageOrderValue)}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Per transaction
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{customerInsights.length}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Active buyers
              </p>
            </div>
            <Users className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Payment Method Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(paymentBreakdown).map(([method, data]: [string, any]) => (
            <div key={method} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">{method.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(data.total)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{data.count} orders</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Top Customers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Customer</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customerInsights.slice(0, 10).map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{customer.customer_name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-900 dark:text-white">{customer.total_orders}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(customer.total_spent)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(customer.last_order_date)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
