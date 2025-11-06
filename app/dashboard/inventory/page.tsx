"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, AlertTriangle, TrendingDown, Plus, Edit, Trash2, Search, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface InventoryItem {
  id: string;
  product_name: string;
  product_code: string;
  category: string;
  current_stock: number;
  unit: string;
  reorder_level: number;
  unit_cost: number;
  unit_price: number;
  is_perishable: boolean;
  expiry_date: string | null;
  wastage_quantity: number;
  last_restocked: string;
  created_at: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchInventory();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'inventory' 
      }, () => {
        fetchInventory();
      })
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

  const lowStockItems = inventory.filter(item => item.current_stock <= item.reorder_level);
  const perishableItems = inventory.filter(item => item.is_perishable);
  const expiringSoon = perishableItems.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = Math.floor((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  });

  const totalWastage = inventory.reduce((sum, item) => sum + (item.wastage_quantity * item.unit_cost), 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = async (formData: any) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .insert([formData]);

      if (error) throw error;
      setShowAddModal(false);
      fetchInventory();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    }
  };

  const handleUpdateItem = async (id: string, formData: any) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .update(formData)
        .eq("id", id);

      if (error) throw error;
      setEditingItem(null);
      fetchInventory();
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-8 h-8" />
          Inventory Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Real-time stock levels, alerts, and wastage tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inventory.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{lowStockItems.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{expiringSoon.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Wastage Loss</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(totalWastage)}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(lowStockItems.length > 0 || expiringSoon.length > 0) && (
        <div className="mb-6 space-y-4">
          {lowStockItems.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                    Low Stock Alert ({lowStockItems.length} items)
                  </h3>
                  <div className="space-y-1">
                    {lowStockItems.slice(0, 5).map(item => (
                      <p key={item.id} className="text-sm text-red-700 dark:text-red-400">
                        <span className="font-medium">{item.product_name}</span> - 
                        Only {item.current_stock} {item.unit} left (Reorder at {item.reorder_level})
                      </p>
                    ))}
                    {lowStockItems.length > 5 && (
                      <p className="text-xs text-red-600 dark:text-red-500">
                        +{lowStockItems.length - 5} more items need restocking
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {expiringSoon.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                    Expiring Soon ({expiringSoon.length} items)
                  </h3>
                  <div className="space-y-1">
                    {expiringSoon.slice(0, 5).map(item => {
                      const daysLeft = Math.floor((new Date(item.expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <p key={item.id} className="text-sm text-orange-700 dark:text-orange-400">
                          <span className="font-medium">{item.product_name}</span> - 
                          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchInventory()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Category</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Value</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Wastage</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInventory.map((item) => {
                  const isLowStock = item.current_stock <= item.reorder_level;
                  const stockValue = item.current_stock * item.unit_cost;
                  const isExpiringSoon = item.is_perishable && item.expiry_date && 
                    Math.floor((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                          {item.is_perishable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 mt-1">
                              Perishable
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{item.product_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {item.current_stock} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Low Stock
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                            Expiring
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(stockValue)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.wastage_quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal would go here - simplified for brevity */}
    </div>
  );
}
