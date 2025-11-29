-- =====================================================
-- POD + Barcode + Notifications Automation
-- - Auto-generate delivery barcode per order
-- - Notify driver on assignment & status changes
-- Date: 2025-02-05
-- =====================================================

-- 1) Function: ensure_order_barcode(order_id)
-- Generates a delivery_barcodes row for the order if missing
CREATE OR REPLACE FUNCTION ensure_order_barcode(p_order_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_barcode_id UUID;
  v_barcode TEXT;
  v_exists BOOLEAN;
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_delivery_location TEXT;
  v_quantity NUMERIC(10,2);
  v_total NUMERIC(10,2);
  v_sale_id UUID;
BEGIN
  -- Check if a barcode already exists
  SELECT id, barcode INTO v_barcode_id, v_barcode
  FROM delivery_barcodes
  WHERE order_id = p_order_id
  LIMIT 1;

  IF v_barcode_id IS NOT NULL THEN
    RETURN v_barcode; -- already exists
  END IF;

  -- Gather order details
  SELECT 
    o.sale_id,
    o.quantity_kg,
    COALESCE(o.total_price, 0) AS total_price,
    COALESCE(o.delivery_address, c.location) AS delivery_location,
    c.name AS customer_name,
    c.phone AS customer_phone
  INTO v_sale_id, v_quantity, v_total, v_delivery_location, v_customer_name, v_customer_phone
  FROM orders o
  LEFT JOIN customers c ON c.id = o.customer_id
  WHERE o.id = p_order_id;

  -- Generate unique barcode via function from barcode migration
  v_barcode := generate_delivery_barcode();

  -- Insert new barcode record
  INSERT INTO delivery_barcodes (
    barcode, order_id, sale_id, customer_name, customer_phone, delivery_location,
    quantity_kg, total_amount, status
  ) VALUES (
    v_barcode, p_order_id, v_sale_id, COALESCE(v_customer_name,'Customer'), v_customer_phone,
    v_delivery_location, COALESCE(v_quantity,0), COALESCE(v_total,0), 'pending'
  );

  RETURN v_barcode;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger: after INSERT on orders → ensure barcode
-- Create a wrapper trigger function to call ensure_order_barcode with NEW.id
CREATE OR REPLACE FUNCTION on_order_insert_ensure_barcode()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM ensure_order_barcode(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_ensure_barcode ON orders;
CREATE TRIGGER trg_orders_ensure_barcode
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION on_order_insert_ensure_barcode();

-- 3) Helper: notify_driver(p_user_id, p_title, p_message, p_link)
CREATE OR REPLACE FUNCTION notify_driver(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO notifications (user_id, type, title, message, link, read)
  VALUES (p_user_id, 'delivery', p_title, p_message, p_link, false);
END;
$$ LANGUAGE plpgsql;

-- 4) Trigger: notify on driver assignment changes
CREATE OR REPLACE FUNCTION on_order_assignment_notify()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Assigned now (OLD null → NEW value)
    IF (OLD.assigned_driver IS NULL AND NEW.assigned_driver IS NOT NULL) THEN
      PERFORM notify_driver(
        NEW.assigned_driver,
        'New Delivery Assigned',
        'You have been assigned a new delivery.',
        '/driver/deliveries/' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_assignment_notify ON orders;
CREATE TRIGGER trg_orders_assignment_notify
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION on_order_assignment_notify();

-- 5) Trigger: notify on status changes (Out for Delivery, Arrived, Completed)
CREATE OR REPLACE FUNCTION on_order_status_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_msg TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.delivery_status IS DISTINCT FROM NEW.delivery_status THEN
    IF NEW.delivery_status = 'Out for Delivery' THEN
      v_title := 'Delivery Started';
      v_msg := 'Your delivery has started. Stay safe on the road.';
    ELSIF NEW.delivery_status = 'Arrived' THEN
      v_title := 'Arrived at Destination';
      v_msg := 'You have arrived at the destination. Proceed to confirmation.';
    ELSIF NEW.delivery_status IN ('Delivered','Completed') THEN
      v_title := 'Delivery Completed';
      v_msg := 'Great work! Delivery marked as completed.';
    END IF;

    IF v_title IS NOT NULL THEN
      PERFORM notify_driver(
        NEW.assigned_driver,
        v_title,
        v_msg,
        '/driver/deliveries/' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_status_notify ON orders;
CREATE TRIGGER trg_orders_status_notify
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION on_order_status_notify();

-- Done
COMMENT ON FUNCTION ensure_order_barcode(UUID) IS 'Generate a delivery barcode for an order if missing and return it';
COMMENT ON FUNCTION notify_driver(UUID, TEXT, TEXT, TEXT) IS 'Insert in-app notification for a driver user';
