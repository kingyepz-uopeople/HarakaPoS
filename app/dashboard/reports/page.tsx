"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, getDateRange } from "@/utils/formatDate";

/**
 * Reports Page Component
 * Displays sales reports and analytics
 */

export default function ReportsPage() {
  const [todayStats, setTodayStats] = useState({ sales: 0, amount: 0, cash: 0, mpesa: 0 });
  const [weekStats, setWeekStats] = useState({ sales: 0, amount: 0 });
  const [monthStats, setMonthStats] = useState({ sales: 0, amount: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReports() {
    // Today's stats
    const today = getDateRange("today");
    const { data: todaySales } = await supabase
      .from("sales")
      .select("*")
      .gte("date", today.start.split("T")[0]);

    if (todaySales) {
      const cash = todaySales.filter(s => s.payment_method === "Cash").reduce((sum, s) => sum + s.amount, 0);
      const mpesa = todaySales.filter(s => s.payment_method === "M-Pesa").reduce((sum, s) => sum + s.amount, 0);
      
      setTodayStats({
        sales: todaySales.length,
        amount: todaySales.reduce((sum, s) => sum + s.amount, 0),
        cash,
        mpesa,
      });
    }

    // Week stats
    const week = getDateRange("week");
    const { data: weekSales } = await supabase
      .from("sales")
      .select("*")
      .gte("date", week.start.split("T")[0]);

    if (weekSales) {
      setWeekStats({
        sales: weekSales.length,
        amount: weekSales.reduce((sum, s) => sum + s.amount, 0),
      });
    }

    // Month stats
    const month = getDateRange("month");
    const { data: monthSales } = await supabase
      .from("sales")
      .select("*")
      .gte("date", month.start.split("T")[0]);

    if (monthSales) {
      setMonthStats({
        sales: monthSales.length,
        amount: monthSales.reduce((sum, s) => sum + s.amount, 0),
      });
    }

    // Recent sales for table
    const { data: recent } = await supabase
      .from("sales")
      .select("*")
      .order("date", { ascending: false })
      .limit(15);

    if (recent) setRecentSales(recent);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Sales analytics and summaries</p>
      </div>

      {/* Today's Stats */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Today&apos;s Performance</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.sales}</div>
              <p className="text-xs text-gray-500 mt-1">Transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayStats.amount)}</div>
              <p className="text-xs text-gray-500 mt-1">Today&apos;s total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayStats.cash)}</div>
              <p className="text-xs text-gray-500 mt-1">Cash received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">M-Pesa Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayStats.mpesa)}</div>
              <p className="text-xs text-gray-500 mt-1">M-Pesa received</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Period Comparisons */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Period Summaries</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Last 7 Days</CardTitle>
              <CardDescription>Weekly performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sales Count</span>
                  <span className="font-semibold">{weekStats.sales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="font-semibold">{formatCurrency(weekStats.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average per Sale</span>
                  <span className="font-semibold">
                    {formatCurrency(weekStats.sales > 0 ? weekStats.amount / weekStats.sales : 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last 30 Days</CardTitle>
              <CardDescription>Monthly performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sales Count</span>
                  <span className="font-semibold">{monthStats.sales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="font-semibold">{formatCurrency(monthStats.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average per Sale</span>
                  <span className="font-semibold">
                    {formatCurrency(monthStats.sales > 0 ? monthStats.amount / monthStats.sales : 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest 15 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.date, "time")}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
