"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Database Connection Test Page
 * Use this to test if you can insert into the orders table
 * Access at: http://localhost:3000/test-db
 */
export default function TestDBPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function testConnection() {
    setLoading(true);
    setResult("Testing connection...\n");

    try {
      // Test 1: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setResult(prev => prev + `❌ AUTH ERROR: ${authError.message}\n`);
        setLoading(false);
        return;
      }

      if (!user) {
        setResult(prev => prev + "❌ Not authenticated. Please login first.\n");
        setLoading(false);
        return;
      }

      setResult(prev => prev + `✅ Authenticated as: ${user.email}\n\n`);

      // Test 2: Check if we can read customers
      setResult(prev => prev + "Testing read access to customers...\n");
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id, name")
        .limit(1);

      if (customerError) {
        setResult(prev => prev + `❌ CUSTOMER READ ERROR: ${customerError.message}\n${customerError.hint || ""}\n`);
        setLoading(false);
        return;
      }

      setResult(prev => prev + `✅ Can read customers. Found ${customers?.length || 0} customer(s)\n\n`);

      if (!customers || customers.length === 0) {
        setResult(prev => prev + "⚠️  No customers found. Please add a customer first.\n");
        setLoading(false);
        return;
      }

      // Test 3: Try to insert an order
      setResult(prev => prev + "Testing insert access to orders...\n");
      
      const testOrder = {
        customer_id: customers[0].id,
        quantity_kg: 1,
        price_per_kg: 120,
        payment_mode: "Cash",
        delivery_status: "Pending",
        delivery_date: new Date().toISOString().split('T')[0],
        updated_by: user?.id || null, // Include the user who's creating the order
      };

      setResult(prev => prev + `Inserting test order: ${JSON.stringify(testOrder, null, 2)}\n\n`);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([testOrder])
        .select();

      if (orderError) {
        setResult(prev => prev + `❌ ORDER INSERT ERROR:\n`);
        setResult(prev => prev + `Message: ${orderError.message}\n`);
        setResult(prev => prev + `Details: ${orderError.details || "N/A"}\n`);
        setResult(prev => prev + `Hint: ${orderError.hint || "N/A"}\n`);
        setResult(prev => prev + `Code: ${orderError.code || "N/A"}\n`);
        setResult(prev => prev + `\nFull error object:\n${JSON.stringify(orderError, null, 2)}\n`);
        setLoading(false);
        return;
      }

      setResult(prev => prev + `✅ SUCCESS! Order inserted:\n${JSON.stringify(orderData, null, 2)}\n\n`);

      // Test 4: Delete the test order
      if (orderData && orderData[0]) {
        setResult(prev => prev + "Cleaning up test order...\n");
        const { error: deleteError } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderData[0].id);

        if (deleteError) {
          setResult(prev => prev + `⚠️  Could not delete test order: ${deleteError.message}\n`);
        } else {
          setResult(prev => prev + "✅ Test order deleted\n");
        }
      }

      setResult(prev => prev + "\n🎉 ALL TESTS PASSED! Your database is working correctly.\n");
    } catch (err: any) {
      setResult(prev => prev + `❌ UNEXPECTED ERROR: ${err.message || err}\n`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Make sure you're logged in to the app</li>
            <li>Make sure you have at least one customer in the database</li>
            <li>Click "Run Test" below</li>
            <li>Check the results to see what's failing</li>
          </ol>
        </div>

        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
        >
          {loading ? "Testing..." : "Run Test"}
        </button>

        {result && (
          <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-x-auto">
            {result}
          </div>
        )}

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Common Issues:</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
            <li><strong>Constraint violation:</strong> Run the SQL fix from <code>supabase/APPLY_THIS_FIX.sql</code></li>
            <li><strong>Permission denied:</strong> Check RLS policies with <code>supabase/CHECK_RLS_POLICIES.sql</code></li>
            <li><strong>Not authenticated:</strong> Go to <a href="/login" className="underline">login page</a></li>
            <li><strong>No customers:</strong> Add a customer first in the dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
