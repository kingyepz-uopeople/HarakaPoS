'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Expense, ExpenseCategory } from '@/lib/types';
import { DollarSign, Plus, Filter, Calendar, TrendingDown, Receipt, Upload, X } from 'lucide-react';

export default function ExpensesPage() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    end: new Date().toISOString().split('T')[0], // Today
  });

  // Summary stats
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category_id: '',
    payment_method: 'cash' as const,
    supplier: '',
    notes: '',
    receipt_file: null as File | null,
  });

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, [selectedCategory, dateRange]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', {
        message: error.message,
        hint: error.hint,
        code: error.code
      });
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        setSetupError('Database tables not set up. Please run the business-expenses.sql migration in Supabase.');
      }
    } else if (data) {
      setCategories(data);
      setSetupError(null);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(id, name)
      `)
      .gte('expense_date', dateRange.start)
      .lte('expense_date', dateRange.end)
      .order('expense_date', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching expenses:', {
        message: error.message,
        hint: error.hint,
        code: error.code
      });
      setLoading(false);
      return;
    }
    
    if (data) {
      setExpenses(data as Expense[]);
      
      // Calculate totals
      const total = data.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpenses(total);

      // Category breakdown
      const breakdown: Record<string, number> = {};
      data.forEach(exp => {
        const catName = exp.category?.name || 'Unknown';
        breakdown[catName] = (breakdown[catName] || 0) + exp.amount;
      });
      setCategoryBreakdown(breakdown);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      alert('Please fill in amount and category');
      return;
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert('You must be logged in to add expenses');
      console.error('Auth error:', userError);
      return;
    }

    let receipt_url = null;

    // Upload receipt if provided
    if (formData.receipt_file) {
      const fileExt = formData.receipt_file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(`expenses/${fileName}`, formData.receipt_file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert(`Failed to upload receipt: ${uploadError.message || 'Unknown error'}`);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(`expenses/${fileName}`);
      
      receipt_url = publicUrl;
    }

    // Insert expense
    const { data: insertData, error } = await supabase.from('expenses').insert({
      expense_date: formData.date,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id,
      description: formData.notes || 'Expense entry', // Required field in schema
      payment_method: formData.payment_method,
      vendor_name: formData.supplier || null,
      receipt_image_url: receipt_url,
      notes: formData.notes || null,
      recorded_by: user.id,
    }).select();

    if (error) {
      console.error('Insert error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      alert(`Failed to add expense: ${error.message || 'Unknown error'}\n\nHint: ${error.hint || 'Check if the expenses table exists and you have permission.'}`);
      return;
    }

    console.log('Expense added successfully:', insertData);

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category_id: '',
      payment_method: 'cash',
      supplier: '',
      notes: '',
      receipt_file: null,
    });
    setShowAddForm(false);
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    
    if (error) {
      alert('Failed to delete expense');
      return;
    }

    fetchExpenses();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Setup Error Alert */}
      {setupError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Setup Required</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{setupError}</p>
                <p className="mt-2">
                  <strong>Steps to fix:</strong>
                </p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Open Supabase Dashboard → SQL Editor</li>
                  <li>Run the migration file: <code className="bg-red-100 px-1 rounded">supabase/migrations/business-expenses.sql</code></li>
                  <li>Refresh this page</li>
                </ol>
                <p className="mt-2">
                  See <a href="/docs/EXPENSE_TRACKING_SETUP.md" className="underline font-semibold">setup guide</a> for detailed instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Business Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage your business expenses</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={!!setupError}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold">KSh {totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Entries</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Period</p>
              <p className="text-lg font-bold">
                {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

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
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryBreakdown).map(([category, amount]) => (
              <div key={category} className="border rounded-lg p-3">
                <p className="text-sm text-gray-600">{category}</p>
                <p className="text-lg font-bold text-red-600">KSh {amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {((amount / totalExpenses) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Expense Entries</h2>
          
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No expenses found for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Supplier</th>
                    <th className="text-left py-3 px-4">Payment Method</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Receipt</th>
                    <th className="text-left py-3 px-4">Notes</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {expense.category?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{expense.vendor_name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-sm">{expense.payment_method.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        KSh {expense.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {expense.receipt_image_url ? (
                          <a
                            href={expense.receipt_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <Receipt className="w-4 h-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm max-w-xs truncate">
                        {expense.notes || expense.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Expense</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (KSh) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method *</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Supplier/Vendor</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Supplier name (optional)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Receipt/Invoice</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFormData({ ...formData, receipt_file: e.target.files?.[0] || null })}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.receipt_file ? formData.receipt_file.name : 'Click to upload receipt (optional)'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF or Image files</p>
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Add Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
