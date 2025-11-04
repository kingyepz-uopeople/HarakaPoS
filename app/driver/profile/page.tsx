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
  Shield
} from "lucide-react";

interface DriverInfo {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
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
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{driverInfo?.name}</h1>
            <p className="text-sm opacity-90">{driverInfo?.role}</p>
          </div>
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
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Location Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Language</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
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
    </div>
  );
}
