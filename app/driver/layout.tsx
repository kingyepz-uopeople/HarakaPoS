"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Truck, User, Bell, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DriverNotifications from "@/components/DriverNotifications";

/**
 * Driver Dashboard Layout
 * Protected layout for driver users with bottom navigation
 */
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [driverName, setDriverName] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("name, role")
      .eq("id", user.id)
      .single();
    
    if (!userData || userData.role !== "driver") {
      router.push("/dashboard");
      return;
    }

    setDriverName(userData.name);
    setLoading(false);
  }

  const navItems = [
    { href: "/driver", icon: Home, label: "Home", exact: true },
    { href: "/driver/deliveries", icon: Truck, label: "Deliveries", exact: false },
    { href: "/driver/inventory", icon: Package, label: "Inventory", exact: false },
    { href: "/driver/profile", icon: User, label: "Profile", exact: false },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 text-white px-4 py-3 sm:py-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <p className="text-xs opacity-90">Welcome back,</p>
            <h1 className="text-base sm:text-lg font-bold">{driverName || "Driver"}</h1>
          </div>
          <DriverNotifications />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20">
        <div className="max-w-4xl mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname?.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-all min-w-[60px] sm:min-w-[70px] ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                      : "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
