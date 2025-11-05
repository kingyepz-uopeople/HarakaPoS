'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProfitAnalysis } from '@/lib/types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download } from 'lucide-react';

export default function ProfitAnalysisPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState<ProfitAnalysis | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    end: new Date().toISOString().split('T')[0], // Today
  });

  // Detailed breakdown
  const [revenueByType, setRevenueByType] = useState<Record<string, number>>({});
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProfitAnalysis();
    fetchDetailedBreakdown();
  }, [dateRange]);

  const fetchProfitAnalysis = async () => {
    setLoading(true);
    setSetupError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_profit_analysis', {
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      if (error) {
        console.warn('RPC function error:', error.message || 'Unknown error');
        
        // Check if function doesn't exist
        if (error.code === '42883' || error.message?.includes('does not exist')) {
          console.log('Function not found, using manual calculation');
          setSetupError('Profit analysis function not found. Using manual calculation.');
        }
        
        // Fallback: Calculate manually without the function
        await calculateProfitManually();
      } else if (data && data.length > 0) {
        setProfitData(data[0]);
        setSetupError(null);
      } else {
        // No data returned, try manual calculation
        console.log('No data from RPC, using manual calculation');
        await calculateProfitManually();
      }
    } catch (err) {
      console.error('Error in fetchProfitAnalysis:', err);
      await calculateProfitManually();
    }

    setLoading(false);
  };

  const calculateProfitManually = async () => {
    try {
      console.log('Calculating profit manually for date range:', dateRange);
      
      // Get total revenue from sales (using 'date' column and 'total_amount')
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      }

      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      console.log('Total revenue:', totalRevenue, 'from', salesData?.length || 0, 'sales');

      // Try to get expenses (may fail if table doesn't exist)
      const { data: expensesData, error: expError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', dateRange.start)
        .lte('expense_date', dateRange.end);

      if (expError) {
        console.warn('Error fetching expenses:', expError.message);
      }

      const totalExpenses = expensesData?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      console.log('Total expenses:', totalExpenses, 'from', expensesData?.length || 0, 'expenses');

      // Calculate profit
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      console.log('Setting profit data:', { totalRevenue, totalExpenses, netProfit, profitMargin });

      setProfitData({
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        profit_margin: profitMargin
      });

      if (expError && expError.code === '42P01') {
        // Expenses table doesn't exist yet
        setSetupError('Expenses tracking not set up yet. Showing revenue only.');
      }
    } catch (err) {
      console.error('Manual calculation failed:', err);
      setProfitData({
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        profit_margin: 0
      });
    }
  };

  const fetchDetailedBreakdown = async () => {
    try {
      // Revenue breakdown - just show total for wedges (no product_type in sales table)
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      if (salesData) {
        const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        setRevenueByType({ 'Wedges Sales': totalRevenue });
      }

      // Expenses breakdown by category
      const { data: expensesData, error: expError } = await supabase
        .from('expenses')
        .select(`
          amount,
          category:expense_categories(name)
        `)
        .gte('expense_date', dateRange.start)
        .lte('expense_date', dateRange.end);

      if (expError) {
        console.warn('Could not fetch expense categories:', expError.message);
        setExpensesByCategory({});
        return;
      }

      if (expensesData) {
        const breakdown: Record<string, number> = {};
        expensesData.forEach((exp: any) => {
          const catName = exp.category?.name || 'Unknown';
          breakdown[catName] = (breakdown[catName] || 0) + exp.amount;
        });
        setExpensesByCategory(breakdown);
      }
    } catch (err) {
      console.error('Error in fetchDetailedBreakdown:', err);
      setRevenueByType({});
      setExpensesByCategory({});
    }
  };

  const exportToCSV = () => {
    if (!profitData) return;

    const csvContent = [
      ['Haraka Wedges Supplies - Profit Analysis Report'],
      [`Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`],
      [],
      ['Summary'],
      ['Total Revenue', profitData.total_revenue.toFixed(2)],
      ['Total Expenses', profitData.total_expenses.toFixed(2)],
      ['Net Profit', profitData.net_profit.toFixed(2)],
      ['Profit Margin', `${profitData.profit_margin.toFixed(2)}%`],
      [],
      ['Revenue Breakdown'],
      ...Object.entries(revenueByType).map(([type, amount]) => [type, amount.toFixed(2)]),
      [],
      ['Expense Breakdown'],
      ...Object.entries(expensesByCategory).map(([cat, amount]) => [cat, amount.toFixed(2)]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-analysis-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Profit Analysis</h1>
          <p className="text-gray-600 mt-1">Revenue vs Expenses - Business Performance</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!profitData}
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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

          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateRange({
                  start: firstDay.toISOString().split('T')[0],
                  end: today.toISOString().split('T')[0],
                });
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                setDateRange({
                  start: lastMonth.toISOString().split('T')[0],
                  end: lastMonthEnd.toISOString().split('T')[0],
                });
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
            >
              Last Month
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading profit analysis...</p>
        </div>
      ) : !profitData ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">No data available for selected period</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    KSh {profitData.total_revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    KSh {profitData.total_expenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className={`${profitData.net_profit >= 0 ? 'bg-blue-100' : 'bg-red-100'} p-3 rounded-lg`}>
                  <DollarSign className={`w-6 h-6 ${profitData.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Net Profit</p>
                  <p className={`text-2xl font-bold ${profitData.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    KSh {profitData.net_profit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className={`${profitData.profit_margin >= 0 ? 'bg-purple-100' : 'bg-red-100'} p-3 rounded-lg`}>
                  <Calendar className={`w-6 h-6 ${profitData.profit_margin >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Profit Margin</p>
                  <p className={`text-2xl font-bold ${profitData.profit_margin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    {profitData.profit_margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Revenue Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Revenue Breakdown</h2>
              {Object.keys(revenueByType).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No revenue data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(revenueByType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, amount]) => {
                      const percentage = (amount / profitData.total_revenue) * 100;
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{type}</span>
                            <span className="text-gray-600">
                              KSh {amount.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Expense Breakdown</h2>
              {Object.keys(expensesByCategory).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No expense data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = (amount / profitData.total_expenses) * 100;
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{category}</span>
                            <span className="text-gray-600">
                              KSh {amount.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Performance Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600 mb-1">Revenue Health</p>
                <p className="text-lg font-semibold">
                  {profitData.total_revenue > 0 ? 'Active Sales Period' : 'No Sales Recorded'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {Object.keys(revenueByType).length} product type(s) sold
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-sm text-gray-600 mb-1">Cost Management</p>
                <p className="text-lg font-semibold">
                  {profitData.total_expenses > 0 
                    ? `${Object.keys(expensesByCategory).length} expense categories`
                    : 'No Expenses Recorded'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {profitData.total_revenue > 0 
                    ? `${((profitData.total_expenses / profitData.total_revenue) * 100).toFixed(1)}% of revenue`
                    : 'N/A'}
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600 mb-1">Profitability Status</p>
                <p className="text-lg font-semibold">
                  {profitData.net_profit >= 0 ? 'Profitable' : 'Loss Making'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {profitData.net_profit >= 0 
                    ? 'Business is generating profit'
                    : 'Expenses exceed revenue - review costs'}
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600 mb-1">Margin Analysis</p>
                <p className="text-lg font-semibold">
                  {profitData.profit_margin >= 20 ? 'Excellent' : 
                   profitData.profit_margin >= 10 ? 'Good' :
                   profitData.profit_margin >= 0 ? 'Fair' : 'Critical'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Target: 20%+ for healthy margins
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
