import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/utils/formatCurrency";
import { ShoppingCart, Package, Truck, TrendingUp, DollarSign, TrendingDown } from "lucide-react";

/**
 * Admin Dashboard Home Page
 * Displays key metrics and overview
 */

async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Get today's sales
  const { data: todaySales, error: salesError } = await supabase
    .from("sales")
    .select("amount")
    .gte("date", today);

  const todayTotal = todaySales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;

  // Get current stock
  const { data: stock, error: stockError } = await supabase
    .from("stock")
    .select("quantity_kg, total_cost");

  const totalStock = stock?.reduce((sum, item) => sum + item.quantity_kg, 0) || 0;
  const totalStockCost = stock?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;
  const avgCostPerKg = totalStock > 0 ? totalStockCost / totalStock : 0;

  // Get sales data (deduct from stock)
  const { data: sales, error: salesStockError } = await supabase
    .from("sales")
    .select("quantity_sold");

  const totalSold = sales?.reduce((sum, sale) => sum + sale.quantity_sold, 0) || 0;
  const remainingStock = totalStock - totalSold;

  // Get pending deliveries (orders not yet delivered)
  const { count: pendingDeliveries } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("delivery_status", ["Scheduled", "Pending", "Out for Delivery", "Arrived"]);

  // Get this month's sales
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data: monthSales } = await supabase
    .from("sales")
    .select("amount")
    .gte("date", firstDayOfMonth);

  const monthTotal = monthSales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;

  return {
    todayTotal,
    remainingStock,
    pendingDeliveries: pendingDeliveries || 0,
    monthTotal,
    totalStockCost,
    avgCostPerKg,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats.todayTotal),
      description: "Total sales today",
      icon: ShoppingCart,
      color: "text-green-600",
    },
    {
      title: "Stock Remaining",
      value: `${stats.remainingStock.toFixed(2)} kg`,
      description: "Available inventory",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries.toString(),
      description: "Active deliveries",
      icon: Truck,
      color: "text-orange-600",
    },
    {
      title: "Month's Revenue",
      value: formatCurrency(stats.monthTotal),
      description: "Total this month",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Total Stock Cost",
      value: formatCurrency(stats.totalStockCost),
      description: "All stock purchased",
      icon: DollarSign,
      color: "text-red-600",
    },
    {
      title: "Avg Cost per Kg",
      value: formatCurrency(stats.avgCostPerKg),
      description: "Average stock cost",
      icon: TrendingDown,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Welcome to HarakaPOS Admin Panel</p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">{card.value}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="dark:text-gray-400">Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/dashboard/sales"
              className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold dark:text-white">Record New Sale</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add a new sales transaction</p>
            </a>
            <a
              href="/dashboard/stock"
              className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold dark:text-white">Update Stock</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add new stock inventory</p>
            </a>
            <a
              href="/dashboard/deliveries"
              className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold dark:text-white">Assign Delivery</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create and assign deliveries</p>
            </a>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">System Status</CardTitle>
            <CardDescription className="dark:text-gray-400">Current system information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
              <span className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Update</span>
              <span className="text-sm text-gray-900 dark:text-white">Just now</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-sm text-gray-900 dark:text-white">1.0.0 MVP</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
