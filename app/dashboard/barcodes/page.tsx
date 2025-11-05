'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DeliveryBarcode } from '@/lib/types';
import { generateDeliveryBarcode, getDeliveryStatistics } from '@/lib/barcode-utils';
import BarcodeDisplay from '@/components/barcode/BarcodeDisplay';
import { 
  Plus, 
  Search, 
  Download, 
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Printer
} from 'lucide-react';

export default function BarcodesPage() {
  const supabase = createClient();
  const [barcodes, setBarcodes] = useState<DeliveryBarcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<DeliveryBarcode | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchBarcodes();
    fetchStatistics();
  }, []);

  const fetchBarcodes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('delivery_barcodes')
        .select(`
          *,
          order:orders(id, delivery_date, delivery_time),
          sale:sales(id, date, total_amount)
        `)
        .order('generated_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setBarcodes(data || []);
    } catch (error) {
      console.error('Error fetching barcodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    const statistics = await getDeliveryStatistics();
    setStats(statistics);
  };

  const handleGenerateBarcode = async (formData: any) => {
    const result = await generateDeliveryBarcode({
      customerName: formData.customer_name,
      customerPhone: formData.customer_phone,
      deliveryLocation: formData.delivery_location,
      quantityKg: parseFloat(formData.quantity_kg),
      totalAmount: parseFloat(formData.total_amount),
      orderId: formData.order_id || undefined,
      saleId: formData.sale_id || undefined,
    });

    if (result.success) {
      alert(`✅ Barcode generated: ${result.barcode}`);
      setShowNewModal(false);
      fetchBarcodes();
      fetchStatistics();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const printBarcode = (barcode: DeliveryBarcode) => {
    setSelectedBarcode(barcode);
    setTimeout(() => window.print(), 100);
  };

  const filteredBarcodes = barcodes.filter(bc =>
    bc.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bc.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bc.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; text: string }> = {
      pending: { icon: Clock, color: 'bg-gray-100 text-gray-700', text: 'Pending' },
      printed: { icon: Printer, color: 'bg-blue-100 text-blue-700', text: 'Printed' },
      loading: { icon: Package, color: 'bg-yellow-100 text-yellow-700', text: 'Loading' },
      in_transit: { icon: Truck, color: 'bg-purple-100 text-purple-700', text: 'In Transit' },
      delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-700', text: 'Delivered' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-700', text: 'Failed' },
      cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-500', text: 'Cancelled' },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Delivery Barcodes</h1>
          <p className="text-gray-600 mt-1">Track deliveries with scannable barcodes</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Generate Barcode
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 no-print">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <p className="text-sm text-purple-700">In Transit</p>
            <p className="text-2xl font-bold text-purple-900">{stats.in_transit}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <p className="text-sm text-green-700">Delivered</p>
            <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <p className="text-sm text-blue-700">Success Rate</p>
            <p className="text-2xl font-bold text-blue-900">{stats.success_rate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search barcode, customer, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              fetchBarcodes();
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="printed">Printed</option>
            <option value="loading">Loading</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={() => {
              fetchBarcodes();
              fetchStatistics();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>
      </div>

      {/* Barcodes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden no-print">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barcode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Generated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  Loading barcodes...
                </td>
              </tr>
            ) : filteredBarcodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No barcodes found. Click "Generate Barcode" to create one.
                </td>
              </tr>
            ) : (
              filteredBarcodes.map((barcode) => (
                <tr key={barcode.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900">{barcode.barcode}</div>
                    <div className="text-xs text-gray-500">{barcode.scan_count} scans</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{barcode.customer_name}</div>
                    <div className="text-xs text-gray-500">{barcode.customer_phone}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{barcode.delivery_location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {barcode.quantity_kg} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    KSh {barcode.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(barcode.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(barcode.generated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => printBarcode(barcode)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Print Barcode"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Show barcode details modal
                          alert(`Barcode: ${barcode.barcode}\nStatus: ${barcode.status}`);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Print Area */}
      {selectedBarcode && (
        <div className="print-area hidden print:block">
          <div className="p-8">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">Haraka Wedges Supplies</h1>
              <p className="text-sm text-gray-600">Delivery Label</p>
            </div>

            <div className="flex justify-center my-6">
              <BarcodeDisplay value={selectedBarcode.barcode} height={80} />
            </div>

            <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Customer:</p>
                  <p>{selectedBarcode.customer_name}</p>
                  <p>{selectedBarcode.customer_phone}</p>
                </div>
                <div>
                  <p className="font-semibold">Quantity:</p>
                  <p>{selectedBarcode.quantity_kg} kg</p>
                  <p className="font-semibold mt-2">Amount:</p>
                  <p>KSh {selectedBarcode.total_amount.toLocaleString()}</p>
                </div>
              </div>
              
              {selectedBarcode.delivery_location && (
                <div className="mt-4">
                  <p className="font-semibold">Delivery Location:</p>
                  <p>{selectedBarcode.delivery_location}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                <p>Generated: {new Date(selectedBarcode.generated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Barcode Modal */}
      {showNewModal && (
        <NewBarcodeModal
          onClose={() => setShowNewModal(false)}
          onGenerate={handleGenerateBarcode}
        />
      )}
    </div>
  );
}

function NewBarcodeModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (data: any) => void }) {
  const supabase = createClient();
  const [mode, setMode] = useState<'order' | 'manual'>('order');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    delivery_location: '',
    quantity_kg: '',
    total_amount: '',
  });

  useEffect(() => {
    fetchOrdersWithoutBarcodes();
  }, []);

  const fetchOrdersWithoutBarcodes = async () => {
    try {
      // Get all orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            location
          )
        `)
        .in('delivery_status', ['Pending', 'Out for Delivery'])
        .order('delivery_date', { ascending: true });

      if (ordersError) throw ordersError;

      // Get orders that already have barcodes
      const { data: existingBarcodes } = await supabase
        .from('delivery_barcodes')
        .select('order_id')
        .not('order_id', 'is', null);

      const orderIdsWithBarcodes = new Set(existingBarcodes?.map(b => b.order_id) || []);

      // Filter out orders that already have barcodes
      const ordersWithoutBarcodes = allOrders?.filter(order => !orderIdsWithBarcodes.has(order.id)) || [];

      setOrders(ordersWithoutBarcodes);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
      setSelectedOrder(order);
      setFormData({
        order_id: order.id,
        customer_name: customer?.name || '',
        customer_phone: customer?.phone || '',
        delivery_location: customer?.location || '',
        quantity_kg: order.quantity_kg?.toString() || '',
        total_amount: order.total_price?.toString() || '',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 no-print">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Generate New Barcode</h2>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('order')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'order'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 From Order
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✏️ Manual Entry
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'order' ? (
            <>
              {/* Order Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Order *
                </label>
                {loadingOrders ? (
                  <div className="text-sm text-gray-500 py-2">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    ⚠️ No orders available without barcodes. All orders either have barcodes or are completed.
                  </div>
                ) : (
                  <select
                    required
                    value={formData.order_id}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select an order --</option>
                    {orders.map((order) => {
                      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                      return (
                        <option key={order.id} value={order.id}>
                          {customer?.name || 'Unknown'} - {order.quantity_kg}kg - KSh {order.total_price?.toLocaleString()} - {order.delivery_date}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Auto-filled Order Details */}
              {selectedOrder && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-blue-900 mb-2">Order Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <p className="font-medium text-gray-900">{formData.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium text-gray-900">{formData.customer_phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium text-gray-900">{formData.delivery_location}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Date:</span>
                      <p className="font-medium text-gray-900">{selectedOrder.delivery_date}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <p className="font-medium text-gray-900">{formData.quantity_kg} kg</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-medium text-gray-900">KSh {parseFloat(formData.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Manual Entry Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Location
                </label>
                <input
                  type="text"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.quantity_kg}
                    onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (KSh) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mode === 'order' && !selectedOrder}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
