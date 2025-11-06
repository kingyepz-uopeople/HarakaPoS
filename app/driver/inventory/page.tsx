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
  TrendingDown
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
    label: string;
  } {
    if (item.current_stock === 0) {
      return { color: "bg-red-100 text-red-800", label: "Out of Stock" };
    }
    if (item.current_stock <= item.reorder_level) {
      return { color: "bg-orange-100 text-orange-800", label: "Low Stock" };
    }
    return { color: "bg-green-100 text-green-800", label: "In Stock" };
  }

  function getDaysUntilExpiry(expiryDate: string | null): number | null {
    if (!expiryDate) return null;
    return Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 mb-20 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.back()}
            className="btn-icon btn-icon-sm btn-ghost"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              Inventory
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              View-only stock levels
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-600 mb-1">Total Items</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {inventory.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-200">
          <p className="text-xs text-orange-600 mb-1">Low Stock</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-700">
            {lowStockItems.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-red-200">
          <p className="text-xs text-red-600 mb-1">Expiring</p>
          <p className="text-xl sm:text-2xl font-bold text-red-700">
            {expiringSoon.length}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-600 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-orange-800">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} low on stock
              </h3>
              <p className="text-xs text-orange-700 mt-1">
                Inform admin to restock: {lowStockItems.slice(0, 3).map(i => i.product_name).join(", ")}
                {lowStockItems.length > 3 && ` +${lowStockItems.length - 3} more`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterView("all")}
            className={`btn btn-sm flex-1 ${
              filterView === "all" ? "btn-primary" : "btn-ghost"
            }`}
          >
            All ({inventory.length})
          </button>
          <button
            onClick={() => setFilterView("low")}
            className={`btn btn-sm flex-1 ${
              filterView === "low" ? "btn-warning" : "btn-ghost"
            }`}
          >
            Low ({lowStockItems.length})
          </button>
          <button
            onClick={() => setFilterView("expiring")}
            className={`btn btn-sm flex-1 ${
              filterView === "expiring" ? "btn-danger" : "btn-ghost"
            }`}
          >
            Expiring ({expiringSoon.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-9 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No items found
          </h3>
          <p className="text-sm sm:text-base text-gray-500">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredInventory.map((item) => {
            const status = getStockStatus(item);
            const daysLeft = getDaysUntilExpiry(item.expiry_date);

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                      {item.product_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {item.product_code}
                      </span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      
                      {item.current_stock <= item.reorder_level && (
                        <span className="flex items-center gap-1 text-xs text-orange-700">
                          <AlertTriangle className="w-3 h-3" />
                          Reorder needed
                        </span>
                      )}

                      {item.is_perishable && daysLeft !== null && daysLeft <= 7 && (
                        <span className="flex items-center gap-1 text-xs text-red-700">
                          <Calendar className="w-3 h-3" />
                          Expires in {daysLeft}d
                        </span>
                      )}

                      {item.wastage_quantity > 0 && (
                        <span className="flex items-center gap-1 text-xs text-purple-700">
                          <TrendingDown className="w-3 h-3" />
                          {item.wastage_quantity} {item.unit} wasted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {item.current_stock}
                    </p>
                    <p className="text-xs text-gray-500">{item.unit}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Min: {item.reorder_level}
                    </p>
                    <p className="text-xs font-medium text-emerald-700 mt-1">
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
