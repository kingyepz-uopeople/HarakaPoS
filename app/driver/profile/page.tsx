"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin,
  LogOut,
  ChevronRight,
  Bell,
  Globe,
  Shield,
  Edit,
  Save,
  X,
  Settings,
  Info
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
          <div className="w-12 h-12 rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="bg-emerald-500 dark:bg-emerald-600 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl font-semibold text-white">
                {driverInfo?.name?.charAt(0) || "D"}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{driverInfo?.name}</h1>
              <span className="text-sm text-emerald-100/80 capitalize">{driverInfo?.role}</span>
            </div>
          </div>
          <button
            onClick={openEditModal}
            className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"
          >
            <Edit className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-medium text-slate-900 dark:text-white text-sm">Personal Information</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-3 flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{driverInfo?.name}</p>
            </div>
          </div>
          <div className="p-3 flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{driverInfo?.email}</p>
            </div>
          </div>
          <div className="p-3 flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{driverInfo?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="font-medium text-slate-900 dark:text-white text-sm">App Settings</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { icon: Bell, label: "Notifications", href: "/driver/profile/notifications" },
            { icon: MapPin, label: "Location Settings", href: "/driver/profile/location" },
            { icon: Globe, label: "Language", href: "/driver/profile/language" },
            { icon: Shield, label: "Privacy & Security", href: "/driver/profile/privacy" },
          ].map((item, index) => (
            <button 
              key={index}
              onClick={() => router.push(item.href)}
              className="w-full p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-900 dark:text-white">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h2 className="font-medium text-slate-900 dark:text-white text-sm">About</h2>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-slate-900 dark:text-white">HarakaPoS Driver App</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Version 1.0.0</p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-lg font-medium"
      >
        <LogOut className="w-4 h-4" />
        <span>{loggingOut ? "Logging out..." : "Logout"}</span>
      </button>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-emerald-500 dark:bg-emerald-600 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                  placeholder="e.g., 0712345678"
                  required
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <label className="block text-xs text-slate-500 dark:text-slate-400">Email</label>
                <p className="text-sm text-slate-900 dark:text-white">{driverInfo?.email}</p>
                <p className="mt-1 text-xs text-slate-400">Contact admin to change email</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
