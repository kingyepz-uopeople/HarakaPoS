"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, ShoppingCart, Package, Truck, BarChart3, Settings, LogOut, 
  ClipboardList, Users, Receipt, TrendingUp, FileText, Barcode,
  Menu, X, ChevronLeft, ChevronRight, FileCheck, Bell, PackageOpen, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

/**
 * Admin Sidebar Component
 * Collapsible navigation sidebar for admin dashboard
 */

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
  { name: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { name: "Receipts", href: "/dashboard/receipts", icon: FileCheck },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Stock", href: "/dashboard/stock", icon: Package },
  { name: "Inventory", href: "/dashboard/inventory", icon: PackageOpen },
  { name: "Assets", href: "/dashboard/assets", icon: DollarSign },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Deliveries", href: "/dashboard/deliveries", icon: Truck },
  { name: "Barcodes", href: "/dashboard/barcodes", icon: Barcode },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Profit Analysis", href: "/dashboard/profit-analysis", icon: TrendingUp },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Save state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // Handle touch end - swipe left to close
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe && isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Close sidebar when clicking outside (mobile)
  const handleOverlayClick = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform active:scale-95"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile Overlay - Click or tap to close */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
          onClick={handleOverlayClick}
          aria-label="Close menu"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
              setIsMobileOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:sticky top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ease-in-out flex flex-col",
          // Desktop
          isCollapsed ? "lg:w-20" : "lg:w-64",
          // Mobile - Slide animation
          isMobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
          <div className={cn("flex items-center gap-2", isCollapsed && "lg:justify-center lg:w-full")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex-shrink-0">
              <span className="text-lg font-bold">H</span>
            </div>
            {!isCollapsed && (
              <div className="lg:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">HarakaPOS</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 min-h-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  isCollapsed && "lg:justify-center lg:px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn("flex-shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          {/* Mobile Swipe Hint */}
          {isMobileOpen && (
            <div className="lg:hidden mb-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
              <ChevronLeft className="w-4 h-4" />
              <span>Swipe or tap outside to close</span>
            </div>
          )}
          
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              className={cn(
                "w-full gap-3 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
                isCollapsed ? "lg:px-2 lg:justify-center" : "justify-start"
              )}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className={cn(isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
