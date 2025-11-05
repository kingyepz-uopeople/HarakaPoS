"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ShoppingCart, Package, Truck, BarChart3, Settings, LogOut, ClipboardList, Users, Receipt, TrendingUp, FileText, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

/**
 * Admin Sidebar Component
 * Navigation sidebar for admin dashboard
 */

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
  { name: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Stock", href: "/dashboard/stock", icon: Package },
  { name: "Deliveries", href: "/dashboard/deliveries", icon: Truck },
  { name: "Barcodes", href: "/dashboard/barcodes", icon: Barcode },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Profit Analysis", href: "/dashboard/profit-analysis", icon: TrendingUp },
  { 
    name: "eTIMS (Tax)", 
    href: "/dashboard/etims", 
    icon: FileText,
    submenu: [
      { name: "Dashboard", href: "/dashboard/etims" },
      { name: "Invoices", href: "/dashboard/etims/invoices" },
      { name: "Configuration", href: "/dashboard/etims/config" },
    ]
  },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
          <span className="text-lg font-bold">H</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">HarakaPOS</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t p-4">
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
