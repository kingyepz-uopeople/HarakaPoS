'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EtimsInvoice, EtimsConfig, EtimsStatistics } from '@/lib/types';
import { FileText, CheckCircle, Clock, XCircle, AlertCircle, Settings, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function EtimsDashboardPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<EtimsInvoice[]>([]);
  const [config, setConfig] = useState<EtimsConfig | null>(null);
  const [stats, setStats] = useState<EtimsStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchConfig();
    fetchInvoices();
    fetchStatistics();
  }, [dateRange]);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('etims_config')
      .select('*')
      .limit(1)
      .single();
    
    if (data) setConfig(data);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('etims_invoices')
      .select('*')
      .gte('invoice_date', dateRange.start)
      .lte('invoice_date', dateRange.end)
      .order('invoice_date', { ascending: false })
      .limit(50);
    
    if (data) setInvoices(data);
    setLoading(false);
  };

  const fetchStatistics = async () => {
    const { data } = await supabase.rpc('get_etims_statistics', {
      start_date: dateRange.start,
      end_date: dateRange.end,
    });
    
    if (data && data.length > 0) {
      setStats(data[0]);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8" />
            eTIMS Tax Compliance
          </h1>
          <p className="text-gray-600 mt-1">Kenya Revenue Authority electronic Tax Invoice Management System</p>
        </div>
        <Link
          href="/dashboard/etims/config"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Settings className="w-5 h-5" />
          Configure eTIMS
        </Link>
      </div>

      {/* Configuration Status */}
      {config ? (
        <div className={`p-4 rounded-lg mb-6 ${
          config.oscu_status === 'active' ? 'bg-green-50 border-2 border-green-500' :
          config.oscu_status === 'pending' ? 'bg-yellow-50 border-2 border-yellow-500' :
          'bg-red-50 border-2 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.oscu_status === 'active' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className="font-semibold">
                  OSCU Status: <span className="capitalize">{config.oscu_status || 'Not Initialized'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Environment: <strong>{config.environment.toUpperCase()}</strong>
                  {config.oscu_device_id && ` | Device: ${config.oscu_device_id}`}
                  {config.oscu_serial_number && ` | Serial: ${config.oscu_serial_number}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">KRA PIN</p>
              <p className="font-mono font-bold">{config.kra_pin}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">eTIMS Not Configured</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Please configure eTIMS settings to start generating tax invoices.</p>
                <Link href="/dashboard/etims/config" className="underline font-semibold">
                  Go to Configuration →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.total_invoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved_invoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_invoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Compliance Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.compliance_rate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateRange({
                  start: firstDay.toISOString().split('T')[0],
                  end: today.toISOString().split('T')[0],
                });
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setDateRange({
                  start: today.toISOString().split('T')[0],
                  end: today.toISOString().split('T')[0],
                });
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Tax Invoices</h2>
          
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No invoices found for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Invoice #</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-right py-3 px-4">VAT</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">KRA Response</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold">{invoice.invoice_number}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{invoice.customer_name}</p>
                          {invoice.customer_tin && (
                            <p className="text-xs text-gray-500">TIN: {invoice.customer_tin}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        KSh {invoice.total_after_tax.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        KSh {invoice.vat_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${getStatusBadge(invoice.submission_status)}`}>
                          {getStatusIcon(invoice.submission_status)}
                          <span className="capitalize">{invoice.submission_status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {invoice.kra_invoice_number ? (
                          <span className="font-mono text-green-600">{invoice.kra_invoice_number}</span>
                        ) : invoice.error_message ? (
                          <span className="text-red-600 text-xs">{invoice.error_message}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">About eTIMS</h3>
        <p className="text-sm text-gray-700">
          The electronic Tax Invoice Management System (eTIMS) is Kenya Revenue Authority's digital system
          for managing tax invoices. All businesses must submit tax invoices electronically for compliance.
        </p>
        <div className="mt-3 text-sm text-gray-700">
          <strong>Support:</strong> etims@kra.go.ke | <strong>Portal:</strong>{' '}
          <a href="https://etims.kra.go.ke" target="_blank" className="text-blue-600 hover:underline">
            https://etims.kra.go.ke
          </a>
        </div>
      </div>
    </div>
  );
}
