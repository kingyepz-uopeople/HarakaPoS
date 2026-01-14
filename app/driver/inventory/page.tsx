"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  Package, 
  AlertTriangle, 
  Search, 
  ArrowLeft,
  Calendar,
  TrendingDown,
  Box
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface InventoryItem {
  id: string;
  product_name: string;
  product_code: string;
  category: string;
  current_stock: number;
  unit: string;
  reorder_level: number;
  unit_price: number;
  is_perishable: boolean;
  expiry_date: string | null;
  wastage_quantity: number;
}

export default function DriverInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterView, setFilterView] = useState<"all" | "low" | "expiring">("all");

  useEffect(() => {
    fetchInventory();

    // Real-time updates
    const channel = supabase
      .channel("driver-inventory")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("product_name");

      if (error) {
        console.error("Error fetching inventory:", error);
      } else {
        setInventory(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = inventory.filter(
    (item) => item.current_stock <= item.reorder_level
  );

  const expiringSoon = inventory.filter((item) => {
    if (!item.is_perishable || !item.expiry_date) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(item.expiry_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  });

  const filteredInventory = inventory
    .filter((item) => {
      const matchesSearch =
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterView === "low") {
        return matchesSearch && item.current_stock <= item.reorder_level;
      }
      if (filterView === "expiring") {
        return matchesSearch && expiringSoon.includes(item);
      }
      return matchesSearch;
    });

  function getStockStatus(item: InventoryItem): {
    color: string;
    bgColor: string;
    label: string;
  } {
    if (item.current_stock === 0) {
      return { color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Out of Stock" };
    }
    if (item.current_stock <= item.reorder_level) {
      return { color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Low Stock" };
    }
    return { color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30", label: "In Stock" };
  }

  function getDaysUntilExpiry(expiryDate: string | null): number | null {
    if (!expiryDate) return null;
    return Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Inventory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">View stock levels</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold text-slate-900 dark:text-white">{inventory.length}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Items</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-lg font-bold text-slate-900 dark:text-white">{lowStockItems.length}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Low Stock</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-500" />
            <span className="text-lg font-bold text-slate-900 dark:text-white">{expiringSoon.length}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Expiring</p>
        </div>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} low on stock
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {lowStockItems.slice(0, 3).map(i => i.product_name).join(", ")}
                {lowStockItems.length > 3 && ` +${lowStockItems.length - 3} more`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        {[
          { key: "all", label: `All (${inventory.length})` },
          { key: "low", label: `Low (${lowStockItems.length})` },
          { key: "expiring", label: `Expiring (${expiringSoon.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterView(tab.key as typeof filterView)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              filterView === tab.key
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading inventory...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-medium text-slate-900 dark:text-white mb-1">No items found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInventory.map((item) => {
            const status = getStockStatus(item);
            const daysLeft = getDaysUntilExpiry(item.expiry_date);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                      {item.product_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                        {item.product_code}
                      </span>
                      <span>{item.category}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                      
                      {item.current_stock <= item.reorder_level && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          Reorder
                        </span>
                      )}

                      {item.is_perishable && daysLeft !== null && daysLeft <= 7 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs">
                          <Calendar className="w-3 h-3" />
                          {daysLeft}d
                        </span>
                      )}

                      {item.wastage_quantity > 0 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs">
                          <TrendingDown className="w-3 h-3" />
                          {item.wastage_quantity} wasted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {item.current_stock}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.unit}</p>
                    <p className="text-xs text-slate-400 mt-1">Min: {item.reorder_level}</p>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatCurrency(item.unit_price)}/{item.unit}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
