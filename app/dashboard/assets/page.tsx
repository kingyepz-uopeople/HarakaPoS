"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Edit2, Trash2, Package, Truck, Laptop, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface Asset {
  id: string;
  asset_name: string;
  asset_code: string;
  category: string;
  purchase_value: number;
  current_value: number;
  purchase_date: string;
  condition: string;
  location: string;
  notes: string;
  created_at: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    asset_name: "",
    asset_code: "",
    category: "Equipment",
    purchase_value: 0,
    current_value: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    condition: "Excellent",
    location: "",
    notes: "",
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingAsset) {
        const { error } = await supabase
          .from("assets")
          .update(formData)
          .eq("id", editingAsset.id);

        if (error) throw error;
        alert("Asset updated successfully!");
      } else {
        const { error } = await supabase
          .from("assets")
          .insert([formData]);

        if (error) throw error;
        alert("Asset added successfully!");
      }

      setShowModal(false);
      setEditingAsset(null);
      resetForm();
      fetchAssets();
    } catch (error: any) {
      console.error("Error saving asset:", error);
      alert("Error saving asset: " + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("Asset deleted successfully!");
      fetchAssets();
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      alert("Error deleting asset: " + error.message);
    }
  }

  function resetForm() {
    setFormData({
      asset_name: "",
      asset_code: "",
      category: "Equipment",
      purchase_value: 0,
      current_value: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      condition: "Excellent",
      location: "",
      notes: "",
    });
  }

  function openEditModal(asset: Asset) {
    setEditingAsset(asset);
    setFormData({
      asset_name: asset.asset_name,
      asset_code: asset.asset_code,
      category: asset.category,
      purchase_value: asset.purchase_value,
      current_value: asset.current_value,
      purchase_date: asset.purchase_date,
      condition: asset.condition,
      location: asset.location,
      notes: asset.notes,
    });
    setShowModal(true);
  }

  const filteredAssets = assets.filter(asset =>
    asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = assets.reduce((sum, asset) => sum + asset.current_value, 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchase_value, 0);
  const depreciation = totalPurchaseValue - totalValue;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      "Equipment": Package,
      "Vehicles": Truck,
      "Technology": Laptop,
      "Furniture": Package,
    };
    const Icon = icons[category] || Package;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Assets</h1>
          <p className="text-gray-600">Manage equipment, vehicles, and other assets</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingAsset(null);
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
            </div>
            <Package className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Value</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValue)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Depreciation</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(depreciation)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search assets by name, code, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No assets found</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Add your first asset
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{asset.asset_name}</div>
                        <div className="text-sm text-gray-500">{asset.asset_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(asset.category)}
                        <span className="text-sm text-gray-900">{asset.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(asset.purchase_value)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                      {formatCurrency(asset.current_value)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        asset.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                        asset.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asset.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(asset)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAsset ? "Edit Asset" : "Add New Asset"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.asset_name}
                    onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Delivery Truck"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.asset_code}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., TRK-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Technology">Technology</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Value (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.purchase_value}
                    onChange={(e) => setFormData({ ...formData, purchase_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Value (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Warehouse A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Additional information about this asset..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAsset(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingAsset ? "Update Asset" : "Add Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
