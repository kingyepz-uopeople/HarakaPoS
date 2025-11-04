import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Print Receipt to PDA Terminal
 * Formats and sends receipt data to thermal printer
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiptId } = body;

    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 });
    }

    // Get receipt with order details
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*, order:orders(*, customer:customers(*))')
      .eq('id', receiptId)
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Format receipt for thermal printer (ESC/POS format)
    const receiptText = formatReceiptForPDA(receipt);

    // In a real implementation, this would:
    // 1. Connect to PDA via Bluetooth/USB
    // 2. Send ESC/POS commands
    // 3. Print the receipt
    // 
    // For now, we'll return the formatted text
    // You would integrate with actual PDA printer SDK here
    // Examples:
    // - Sunmi POS SDK
    // - Telpo POS SDK
    // - Generic ESC/POS printer

    console.log('Receipt to print:', receiptText);

    return NextResponse.json({
      success: true,
      message: 'Receipt sent to PDA printer',
      receiptData: receiptText,
      // In real implementation, add print status
    });

  } catch (error: any) {
    console.error('Print error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to print receipt' },
      { status: 500 }
    );
  }
}

/**
 * Format receipt for thermal printer (58mm or 80mm)
 * Returns ESC/POS compatible text
 */
function formatReceiptForPDA(receipt: any): string {
  const items = typeof receipt.items === 'string' 
    ? JSON.parse(receipt.items) 
    : receipt.items;

  const order = receipt.order;
  const customer = order?.customer;

  // ESC/POS formatting
  const lines: string[] = [];

  // Header (centered)
  lines.push('================================');
  lines.push('       HARAKA POS');
  lines.push('   Processed Potatoes');
  lines.push('================================');
  lines.push('');

  // Receipt info
  lines.push(`Receipt: ${receipt.receipt_number}`);
  lines.push(`Date: ${new Date(receipt.created_at).toLocaleDateString()}`);
  lines.push(`Time: ${new Date(receipt.created_at).toLocaleTimeString()}`);
  lines.push('');

  // Customer info
  if (customer) {
    lines.push(`Customer: ${customer.name}`);
    if (customer.phone) {
      lines.push(`Phone: ${customer.phone}`);
    }
    if (customer.location) {
      lines.push(`Location: ${customer.location}`);
    }
    lines.push('');
  }

  lines.push('--------------------------------');
  lines.push('ITEMS');
  lines.push('--------------------------------');

  // Line items
  items.forEach((item: any) => {
    lines.push(item.description);
    lines.push(`  ${item.quantity} x KES ${item.unit_price.toFixed(2)}`);
    lines.push(`  Total: KES ${item.total.toFixed(2)}`);
    lines.push('');
  });

  lines.push('--------------------------------');

  // Totals
  lines.push(`Subtotal:     KES ${receipt.subtotal.toFixed(2)}`);
  
  if (receipt.tax && receipt.tax > 0) {
    lines.push(`Tax:          KES ${receipt.tax.toFixed(2)}`);
  }
  
  lines.push('================================');
  lines.push(`TOTAL:        KES ${receipt.total.toFixed(2)}`);
  lines.push('================================');
  lines.push('');

  // Payment method
  const paymentMethod = receipt.payment_method.toUpperCase();
  lines.push(`Payment: ${paymentMethod}`);
  lines.push('');

  // Footer
  lines.push('--------------------------------');
  lines.push('   Thank you for your business!');
  lines.push('');
  lines.push('   For queries contact us at:');
  lines.push('   info@harakapos.co.ke');
  lines.push('   Tel: +254 XXX XXX XXX');
  lines.push('--------------------------------');
  lines.push('');
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate ESC/POS commands for thermal printer
 * (For actual hardware integration)
 */
function generateESCPOSCommands(receipt: any): Buffer {
  const ESC = '\x1B';
  const GS = '\x1D';
  
  const commands: string[] = [];

  // Initialize printer
  commands.push(ESC + '@');

  // Set character set
  commands.push(ESC + 't' + '\x10');

  // Center align
  commands.push(ESC + 'a' + '\x01');

  // Bold on
  commands.push(ESC + 'E' + '\x01');
  commands.push('HARAKA POS\n');
  commands.push(ESC + 'E' + '\x00'); // Bold off

  commands.push('Processed Potatoes\n');
  commands.push('================================\n\n');

  // Left align
  commands.push(ESC + 'a' + '\x00');

  // Add receipt content...
  const receiptText = formatReceiptForPDA(receipt);
  commands.push(receiptText);

  // Cut paper
  commands.push(GS + 'V' + '\x41' + '\x03');

  return Buffer.from(commands.join(''), 'binary');
}
