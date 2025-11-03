'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SaleWithDelivery, PaymentMethod, Order, Customer, Settings } from '@/lib/types';
import { 
  ShoppingCart, 
  Plus, 
  X, 
  TrendingUp, 
  DollarSign, 
  Package,
  AlertCircle,
  Receipt,
  Users
} from 'lucide-react';

type SaleType = 'order' | 'walkin';

export default function SalesPage() {
  const supabase = createClient();
  
  const [sales, setSales] = useState<SaleWithDelivery[]>([]);
  const [orders, setOrders] = useState<(Order & { customer?: Customer })[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [defaultPrice, setDefaultPrice] = useState(120);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Form state
  const [saleType, setSaleType] = useState<SaleType>('order');
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [formData, setFormData] = useState({
    customer_id: '',
    quantity_sold: 0,
    price_per_kg: 0,
    total_amount: 0,
    payment_method: 'Cash' as PaymentMethod,
    delivery_location: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sales with related data (order join is optional if migration not applied yet)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          driver:users(*)
        `)
        .order('date', { ascending: false });

      if (salesError) {
        console.error('Sales fetch error:', salesError);
        throw salesError;
      }
      setSales(salesData || []);

      // Calculate stats
      const revenue = (salesData || []).reduce((sum, sale) => sum + sale.total_amount, 0);
      const quantity = (salesData || []).reduce((sum, sale) => sum + sale.quantity_sold, 0);
      setTotalRevenue(revenue);
      setTotalSales((salesData || []).length);
      setTotalQuantity(quantity);

      // Fetch pending/scheduled orders (for order-based sales)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .in('delivery_status', ['Pending', 'On the Way'])
        .order('delivery_date', { ascending: true });

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        // Don't throw - orders are optional
      } else {
        setOrders(ordersData || []);
      }

      // Fetch customers (for walk-in sales)
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (customersError) {
        console.error('Customers fetch error:', customersError);
        throw customersError;
      }
      setCustomers(customersData || []);

      // Fetch settings (for default price)
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'price_per_kg')
        .single();

      if (settingsError) {
        console.error('Settings fetch error:', settingsError);
        // Don't throw - will use default price
      }
      if (settingsData && settingsData.value) {
        const price = parseFloat(settingsData.value);
        if (!isNaN(price)) {
          setDefaultPrice(price);
        }
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrder(orderId);
    
    if (!orderId) {
      // Reset form
      setFormData({
        customer_id: '',
        quantity_sold: 0,
        price_per_kg: defaultPrice,
        total_amount: 0,
        payment_method: 'Cash',
        delivery_location: ''
      });
      return;
    }

    // Auto-fill from order
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const quantity = order.quantity_kg;
      const price = order.price_per_kg || defaultPrice;
      const total = quantity * price;

      setFormData({
        customer_id: order.customer_id || '',
        quantity_sold: quantity,
        price_per_kg: price,
        total_amount: total,
        payment_method: 'Cash',
        delivery_location: order.customer?.location || ''
      });
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setFormData(prev => ({ ...prev, customer_id: customerId }));
    
    // Auto-fill delivery location if customer selected
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.location) {
      setFormData(prev => ({ ...prev, delivery_location: customer.location || '' }));
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setFormData(prev => {
      const total = quantity * prev.price_per_kg;
      return { ...prev, quantity_sold: quantity, total_amount: total };
    });
  };

  const handlePriceChange = (price: number) => {
    setFormData(prev => {
      const total = prev.quantity_sold * price;
      return { ...prev, price_per_kg: price, total_amount: total };
    });
  };

  const openModal = () => {
    setShowModal(true);
    setSaleType('order');
    setSelectedOrder('');
    setFormData({
      customer_id: '',
      quantity_sold: 0,
      price_per_kg: defaultPrice,
      total_amount: 0,
      payment_method: 'Cash',
      delivery_location: ''
    });
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate
      if (formData.quantity_sold <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (formData.total_amount <= 0) {
        throw new Error('Total amount must be greater than 0');
      }
      if (!formData.customer_id) {
        throw new Error('Please select a customer');
      }

      // Insert sale
      const saleData: any = {
        date: new Date().toISOString(),
        customer_id: formData.customer_id,
        quantity_sold: formData.quantity_sold,
        price_per_kg: formData.price_per_kg,
        total_amount: formData.total_amount,
        payment_method: formData.payment_method,
        delivery_location: formData.delivery_location,
        order_id: saleType === 'order' ? selectedOrder : null
      };

      const { error: insertError } = await supabase
        .from('sales')
        .insert([saleData]);

      if (insertError) throw insertError;

      // If sale from order, mark order as Delivered
      if (saleType === 'order' && selectedOrder) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ delivery_status: 'Delivered' })
          .eq('id', selectedOrder);

        if (updateError) {
          console.error('Error updating order status:', updateError);
          // Don't throw - sale was recorded successfully
        }
      }

      // Success
      closeModal();
      fetchData();
    } catch (err: any) {
      console.error('Error recording sale:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Error loading data</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={() => {
                  setError('');
                  fetchData();
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Record sales from orders or walk-in customers
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Record Sale
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                KES {totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalSales}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Quantity (kg)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalQuantity.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/kg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sales recorded yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Click &quot;Record Sale&quot; to get started
                    </p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(sale.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      {sale.order_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <Receipt className="w-3 h-3" />
                          Order
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <Users className="w-3 h-3" />
                          Walk-in
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sale.order_id ? `#${sale.order_id.slice(0, 8)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.customer?.name || sale.customer_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.quantity_sold}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      KES {sale.price_per_kg}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      KES {sale.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        sale.payment_method === 'Cash' 
                          ? 'bg-green-100 text-green-700'
                          : sale.payment_method === 'M-Pesa'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sale.delivery_location || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Record Sale</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Sale Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sale Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="order"
                      checked={saleType === 'order'}
                      onChange={(e) => {
                        setSaleType(e.target.value as SaleType);
                        setSelectedOrder('');
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">From Order</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="walkin"
                      checked={saleType === 'walkin'}
                      onChange={(e) => {
                        setSaleType(e.target.value as SaleType);
                        setSelectedOrder('');
                        setFormData({
                          customer_id: '',
                          quantity_sold: 0,
                          price_per_kg: defaultPrice,
                          total_amount: 0,
                          payment_method: 'Cash',
                          delivery_location: ''
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Walk-In Sale</span>
                  </label>
                </div>
              </div>

              {/* Order Selection (if order type) */}
              {saleType === 'order' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Order
                  </label>
                  {orders.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">
                          No pending orders available. All orders are either delivered or cancelled.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedOrder}
                      onChange={(e) => handleOrderSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={saleType === 'order'}
                    >
                      <option value="">-- Select an order --</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.customer?.name || 'Unknown'} - {order.quantity_kg}kg - {order.customer?.location || 'N/A'} ({new Date(order.delivery_date).toLocaleDateString('en-GB')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Customer Selection (if walk-in) */}
              {saleType === 'walkin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Select a customer --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone} ({customer.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  value={formData.quantity_sold || ''}
                  onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                  disabled={saleType === 'order' && !!selectedOrder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              {/* Price per kg */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per kg (KES)
                </label>
                <input
                  type="number"
                  value={formData.price_per_kg || ''}
                  onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                  disabled={saleType === 'order' && !!selectedOrder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  min="1"
                  required
                />
              </div>

              {/* Total Amount (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.total_amount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Delivery Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Location
                </label>
                <input
                  type="text"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_location: e.target.value }))}
                  disabled={saleType === 'order' && !!selectedOrder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter delivery location"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (saleType === 'order' && !selectedOrder)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Recording...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
