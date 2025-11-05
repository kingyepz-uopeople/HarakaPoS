'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EtimsConfig } from '@/lib/types';
import { Settings, Save, AlertCircle, CheckCircle, Server } from 'lucide-react';

export default function EtimsConfigPage() {
  const supabase = createClient();
  const [config, setConfig] = useState<EtimsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    business_name: 'Haraka Wedges Supplies',
    kra_pin: '',
    business_type: 'sole_proprietorship',
    cu_serial_number: '',
    cu_model: '',
    use_virtual_cu: false,
    environment: 'sandbox' as 'sandbox' | 'production',
    bhf_id: '',
    tin: '',
    invoice_prefix: 'INV',
    auto_submit: true,
    require_internet: true,
    print_qr_code: true,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('etims_config')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching eTIMS config:', error);
    } else if (data) {
      setConfig(data);
      setFormData({
        business_name: data.business_name,
        kra_pin: data.kra_pin,
        business_type: data.business_type,
        cu_serial_number: data.cu_serial_number || '',
        use_virtual_cu: !data.cu_serial_number || data.cu_serial_number.startsWith('VIRTUAL'),
        cu_model: data.cu_model || '',
        environment: data.environment,
        bhf_id: data.bhf_id || '',
        tin: data.tin || '',
        invoice_prefix: data.invoice_prefix,
        auto_submit: data.auto_submit,
        require_internet: data.require_internet,
        print_qr_code: data.print_qr_code,
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in' });
      setSaving(false);
      return;
    }

    const apiUrl = formData.environment === 'sandbox'
      ? 'https://etims-api-sbx.kra.go.ke/etims-api'
      : 'https://etims-api.kra.go.ke/etims-api';

    const updateData = {
      ...formData,
      api_base_url: apiUrl,
      configured_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (config) {
      // Update existing
      const { error } = await supabase
        .from('etims_config')
        .update(updateData)
        .eq('id', config.id);

      if (error) {
        setMessage({ type: 'error', text: `Failed to update: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'eTIMS configuration updated successfully!' });
        fetchConfig();
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('etims_config')
        .insert([updateData]);

      if (error) {
        setMessage({ type: 'error', text: `Failed to save: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'eTIMS configuration saved successfully!' });
        fetchConfig();
      }
    }

    setSaving(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8" />
          eTIMS Configuration
        </h1>
        <p className="text-gray-600 mt-1">
          Configure Kenya Revenue Authority (KRA) eTIMS integration for tax compliance
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Before You Start</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Register your business with KRA if not already done</li>
                <li>Get a Control Unit (CU) device from KRA approved suppliers</li>
                <li>Obtain your CU serial number and device initialization code</li>
                <li>Test in <strong>Sandbox</strong> environment first before going live</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      {config && (
        <div className={`p-4 rounded-lg mb-6 ${
          config.cu_status === 'active' ? 'bg-green-50 border-2 border-green-500' :
          config.cu_status === 'pending' ? 'bg-yellow-50 border-2 border-yellow-500' :
          'bg-red-50 border-2 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {config.cu_status === 'active' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <p className="font-semibold">
                Status: <span className="capitalize">{config.cu_status}</span>
              </p>
              <p className="text-sm text-gray-600">
                Environment: <strong>{config.environment.toUpperCase()}</strong>
                {config.cu_serial_number && ` | CU Serial: ${config.cu_serial_number}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Configuration Form */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Business Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Business Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  KRA PIN *
                  <span className="text-gray-500 text-xs ml-2">(e.g., P051234567X)</span>
                </label>
                <input
                  type="text"
                  value={formData.kra_pin}
                  onChange={(e) => setFormData({ ...formData, kra_pin: e.target.value.toUpperCase() })}
                  placeholder="P000000000A"
                  className="w-full px-3 py-2 border rounded-lg uppercase"
                  maxLength={11}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="limited_company">Limited Company</option>
                  <option value="cooperative">Cooperative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  TIN (Tax Identification Number)
                </label>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Control Unit Information */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Control Unit (CU) Information</h2>
            
            {/* Virtual CU Option */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="use_virtual_cu"
                  checked={formData.use_virtual_cu}
                  onChange={(e) => {
                    const useVirtual = e.target.checked;
                    setFormData({ 
                      ...formData, 
                      use_virtual_cu: useVirtual,
                      cu_serial_number: useVirtual ? 'VIRTUAL-CU-' + Date.now() : ''
                    });
                  }}
                  className="mt-1"
                />
                <label htmlFor="use_virtual_cu" className="flex-1">
                  <div className="font-semibold text-blue-900">Use Virtual Control Unit (Recommended for Testing)</div>
                  <div className="text-sm text-blue-700 mt-1">
                    ✅ <strong>Benefits:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>No physical KRA device required</li>
                      <li>Perfect for sandbox/testing environment</li>
                      <li>Instant setup - no waiting for KRA hardware</li>
                      <li>Full eTIMS functionality without hardware costs</li>
                      <li>Easy migration to physical CU later</li>
                    </ul>
                  </div>
                  {formData.use_virtual_cu && (
                    <div className="mt-2 text-xs bg-white border border-blue-300 rounded p-2">
                      <strong>Auto-generated Virtual CU:</strong> {formData.cu_serial_number}
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!formData.use_virtual_cu && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      CU Serial Number *
                      <span className="text-gray-500 text-xs ml-2">(From physical KRA device)</span>
                    </label>
                    <input
                      type="text"
                      required={!formData.use_virtual_cu}
                      value={formData.cu_serial_number}
                      onChange={(e) => setFormData({ ...formData, cu_serial_number: e.target.value })}
                      placeholder="CU-XXXX-XXXX-XXXX"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      CU Model
                    </label>
                    <input
                      type="text"
                      value={formData.cu_model}
                      onChange={(e) => setFormData({ ...formData, cu_model: e.target.value })}
                      placeholder="e.g., KRA-CU-V2"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Branch ID (BHF ID)
                </label>
                <input
                  type="text"
                  value={formData.bhf_id}
                  onChange={(e) => setFormData({ ...formData, bhf_id: e.target.value })}
                  placeholder="00"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Usually "00" for single branch</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Environment *
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'sandbox' | 'production' })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.environment === 'sandbox' 
                    ? '⚠️ Test environment - No real tax submission'
                    : '🚨 LIVE environment - Real tax invoices!'}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Invoice Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Invoice Prefix *
                </label>
                <input
                  type="text"
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
                  placeholder="INV"
                  className="w-full px-3 py-2 border rounded-lg uppercase"
                  maxLength={5}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: {formData.invoice_prefix}-2025-00001
                </p>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.auto_submit}
                  onChange={(e) => setFormData({ ...formData, auto_submit: e.target.checked })}
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-medium">Auto-submit invoices to KRA</span>
                  <p className="text-sm text-gray-600">Automatically send invoices to KRA after each sale</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.require_internet}
                  onChange={(e) => setFormData({ ...formData, require_internet: e.target.checked })}
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-medium">Require internet for sales</span>
                  <p className="text-sm text-gray-600">Block sales if no internet connection (recommended for compliance)</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.print_qr_code}
                  onChange={(e) => setFormData({ ...formData, print_qr_code: e.target.checked })}
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-medium">Print QR code on receipts</span>
                  <p className="text-sm text-gray-600">Include KRA verification QR code on thermal receipts</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>KRA eTIMS Support:</strong> etims@kra.go.ke</li>
          <li>• <strong>eTIMS Portal:</strong> <a href="https://etims.kra.go.ke" target="_blank" className="text-blue-600 hover:underline">https://etims.kra.go.ke</a></li>
          <li>• <strong>Technical Support:</strong> +254 791 890 8858</li>
        </ul>
      </div>
    </div>
  );
}
