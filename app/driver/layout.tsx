"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Truck, User, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DriverNotifications from "@/components/DriverNotifications";
import ThemeToggle from "@/components/ThemeToggle";

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
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-emerald-500 dark:bg-emerald-600">
        <div className="px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-base font-semibold text-white">
                  {driverName?.charAt(0) || "D"}
                </span>
              </div>
              <div>
                <p className="text-xs text-emerald-100/80">Welcome back</p>
                <h1 className="text-sm sm:text-base font-semibold text-white">{driverName || "Driver"}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DriverNotifications />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-lg mx-auto px-2 py-2">
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
                    className={`flex flex-col items-center justify-center px-4 py-2 transition-colors ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
      </nav>
    </div>
  );
}
