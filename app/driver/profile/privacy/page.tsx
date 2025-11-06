"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Info, Download } from "lucide-react";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  function handleChangePassword() {
    router.push("/change-password");
  }

  function handleDownloadData() {
    alert("Your data download will be prepared and sent to your email within 24 hours.");
  }

  function handleDeleteAccount() {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone. Please contact admin to proceed."
    );
    if (confirmed) {
      alert("Please contact the administrator to delete your account.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-900">Privacy & Security</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Account Security */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Account Security</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              onClick={handleChangePassword}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
              </div>
            </button>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  {showPassword ? <Eye className="w-5 h-5 text-blue-600" /> : <EyeOff className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Show Password in App</p>
                  <p className="text-xs text-gray-500">Display password when typing</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Data & Privacy</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              onClick={handleDownloadData}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Download className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Download My Data</p>
                  <p className="text-xs text-gray-500">Get a copy of your delivery data</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Privacy Policy</p>
                  <p className="text-xs text-gray-500">Read our privacy policy</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-200">
          <div className="p-4 border-b border-red-200 bg-red-50">
            <h2 className="font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-4">
            <button
              onClick={handleDeleteAccount}
              className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-between border-2 border-red-200"
            >
              <div className="text-left">
                <p className="font-semibold text-red-900">Delete Account</p>
                <p className="text-sm text-red-700">Permanently delete your account and all data</p>
              </div>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Your Privacy Matters</h3>
              <p className="text-sm text-blue-700">
                We take your privacy seriously. Your delivery data is encrypted and only used to improve your experience. We never sell your personal information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
