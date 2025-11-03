/**
 * Settings Helper Utilities
 * Functions to fetch, parse, and manage app settings from Supabase
 */

import { createClient } from "@/lib/supabase/client";
import type { Settings, AppSettings } from "@/lib/types";

/**
 * Fetch all settings from Supabase
 */
export async function getAllSettings(): Promise<Settings[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .order("key");

  if (error) {
    console.error("Error fetching settings:", error);
    return [];
  }

  return data as Settings[];
}

/**
 * Get a single setting value by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }

  return data.value;
}

/**
 * Parse settings array into typed AppSettings object
 */
export function parseSettings(settings: Settings[]): AppSettings {
  const parsed: any = {};

  settings.forEach((setting) => {
    const { key, value, type } = setting;

    if (type === "number") {
      parsed[key] = parseFloat(value) || 0;
    } else if (type === "json") {
      try {
        parsed[key] = JSON.parse(value);
      } catch {
        parsed[key] = value;
      }
    } else {
      parsed[key] = value;
    }
  });

  return parsed as AppSettings;
}

/**
 * Get parsed app settings
 */
export async function getAppSettings(): Promise<AppSettings> {
  const settings = await getAllSettings();
  return parseSettings(settings);
}

/**
 * Update a setting value
 */
export async function updateSetting(
  key: string,
  value: string | number | object
): Promise<boolean> {
  const supabase = createClient();

  // Convert value to string for storage
  const stringValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  const { error } = await supabase
    .from("settings")
    .update({ value: stringValue })
    .eq("key", key);

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }

  return true;
}

/**
 * Update multiple settings at once
 */
export async function updateMultipleSettings(
  updates: Record<string, string | number | object>
): Promise<boolean> {
  const results = await Promise.all(
    Object.entries(updates).map(([key, value]) => updateSetting(key, value))
  );

  return results.every((result) => result === true);
}

/**
 * Get current price per kg (commonly used)
 */
export async function getPricePerKg(): Promise<number> {
  const value = await getSetting("price_per_kg");
  return value ? parseFloat(value) : 120; // Default fallback
}

/**
 * Get delivery fee
 */
export async function getDeliveryFee(): Promise<number> {
  const value = await getSetting("delivery_fee_flat");
  return value ? parseFloat(value) : 100; // Default fallback
}

/**
 * Get available payment modes
 */
export async function getPaymentModes(): Promise<string[]> {
  const value = await getSetting("payment_modes");
  if (!value) return ["Cash", "M-Pesa"];

  try {
    return JSON.parse(value);
  } catch {
    return ["Cash", "M-Pesa"];
  }
}
