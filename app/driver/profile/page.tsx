"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Truck,
  LogOut,
  ChevronRight,
  Bell,
  Globe,
  Shield,
  Edit,
  Save,
  X
} from "lucide-react";

interface DriverInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userData) {
        setDriverInfo({
          id: user.id,
          name: userData.name || "Driver",
          email: user.email || "N/A",
          phone: userData.phone || "N/A",
          role: userData.role,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal() {
    if (!driverInfo) return;
    setEditFormData({
      name: driverInfo.name,
      phone: driverInfo.phone,
    });
    setShowEditModal(true);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!driverInfo) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editFormData.name.trim(),
          phone: editFormData.phone.trim(),
        })
        .eq("id", driverInfo.id);

      if (error) throw error;

      // Update local state
      setDriverInfo({
        ...driverInfo,
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
      });

      setShowEditModal(false);
      alert("Profile updated successfully!");
    } catch (error) {
      // Surface a clearer error message in dev/production
      const err = error as any;
      console.error("Error updating profile:", err);
      const msg = err?.message || err?.hint || (typeof err === "string" ? err : "");
      alert(`Error updating profile${msg ? `: ${msg}` : ". Please try again."}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (!confirm("Are you sure you want to logout?")) return;
    
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Error logging out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{driverInfo?.name}</h1>
              <p className="text-sm opacity-90">{driverInfo?.role}</p>
            </div>
          </div>
          <button
            onClick={openEditModal}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{driverInfo?.name}</p>
            </div>
          </div>

          <div className="p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{driverInfo?.email}</p>
            </div>
          </div>

          <div className="p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{driverInfo?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">App Settings</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <button 
            onClick={() => router.push('/driver/profile/notifications')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button 
            onClick={() => router.push('/driver/profile/location')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Location Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button 
            onClick={() => router.push('/driver/profile/language')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Language</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button 
            onClick={() => router.push('/driver/profile/privacy')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Privacy & Security</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">About</h2>
        </div>
        <div className="p-4 space-y-2 text-sm text-gray-600">
          <p>HarakaPoS Driver App</p>
          <p>Version 1.0.0</p>
          <p className="text-xs text-gray-400">© 2025 HarakaPoS. All rights reserved.</p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 px-4 rounded-2xl font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <LogOut className="w-5 h-5" />
        <span>{loggingOut ? "Logging out..." : "Logout"}</span>
      </button>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="e.g., 0712345678"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Format: 07XX XXX XXX or +254 XXX XXX XXX</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{driverInfo?.email}</p>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Contact admin if needed.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
