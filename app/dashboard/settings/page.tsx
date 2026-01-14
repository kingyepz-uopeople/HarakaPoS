"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Settings as SettingsIcon, Save, RefreshCw, DollarSign, CreditCard, Building2, Lightbulb } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { Settings } from "@/lib/types";

/**
 * Admin Settings Page
 * Allows admin to configure system-wide settings
 */

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [paymentModes, setPaymentModes] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("key");

    if (data) {
      setSettings(data as Settings[]);

      // Build form data from settings
      const initialFormData: Record<string, string> = {};
      data.forEach((setting) => {
        initialFormData[setting.key] = setting.value;
      });
      setFormData(initialFormData);

      // Parse payment modes for checkboxes
      const paymentSetting = data.find((s) => s.key === "payment_modes");
      if (paymentSetting) {
        try {
          setPaymentModes(JSON.parse(paymentSetting.value));
        } catch {
          setPaymentModes(["Cash", "M-Pesa"]);
        }
      }
    }

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);

    try {
      // Update payment modes JSON
      const updatedFormData = {
        ...formData,
        payment_modes: JSON.stringify(paymentModes),
      };

      // Update each setting
      const updates = Object.entries(updatedFormData).map(([key, value]) =>
        supabase.from("settings").update({ value }).eq("key", key)
      );

      await Promise.all(updates);

      // Show success message
      alert("Settings updated successfully!");

      // Reload settings
      loadSettings();
    } catch (error: any) {
      alert("Error updating settings: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(key: string, value: string) {
    setFormData({ ...formData, [key]: value });
  }

  function togglePaymentMode(mode: string) {
    if (paymentModes.includes(mode)) {
      setPaymentModes(paymentModes.filter((m) => m !== mode));
    } else {
      setPaymentModes([...paymentModes, mode]);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Configure business and operational settings</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 max-w-4xl">{/* Pricing Section */}
        {/* Pricing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Pricing Settings
            </CardTitle>
            <CardDescription>Configure default prices and fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price_per_kg">Price per Kg (KES)</Label>
                <Input
                  id="price_per_kg"
                  type="number"
                  step="0.01"
                  value={formData.price_per_kg || ""}
                  onChange={(e) => handleInputChange("price_per_kg", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Default price for potato sales</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_fee_flat">Delivery Fee (KES)</Label>
                <Input
                  id="delivery_fee_flat"
                  type="number"
                  step="0.01"
                  value={formData.delivery_fee_flat || ""}
                  onChange={(e) => handleInputChange("delivery_fee_flat", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Flat delivery fee</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={formData.tax_rate || "0"}
                  onChange={(e) => handleInputChange("tax_rate", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Tax percentage (0 = no tax)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Methods
            </CardTitle>
            <CardDescription>Select available payment options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Cash", "M-Pesa", "Bank Transfer", "Credit Card"].map((mode) => (
                <label key={mode} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentModes.includes(mode)}
                    onChange={() => togglePaymentMode(mode)}
                    className="w-4 h-4 text-green-600 bg-background border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 accent-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mode}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Business Information
            </CardTitle>
            <CardDescription>Update company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                type="text"
                value={formData.business_name || ""}
                onChange={(e) => handleInputChange("business_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_phone">Phone Number</Label>
              <Input
                id="business_phone"
                type="tel"
                value={formData.business_phone || ""}
                onChange={(e) => handleInputChange("business_phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_address">Address</Label>
              <Input
                id="business_address"
                type="text"
                value={formData.business_address || ""}
                onChange={(e) => handleInputChange("business_address", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency Code</Label>
              <Input
                id="currency"
                type="text"
                value={formData.currency || "KES"}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                maxLength={3}
              />
              <p className="text-xs text-muted-foreground">3-letter currency code (e.g., KES, USD)</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>

          <Button
            onClick={loadSettings}
            variant="outline"
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Note:</strong> These settings will be used as defaults across the system. 
                You can still override values manually when creating sales or deliveries.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
