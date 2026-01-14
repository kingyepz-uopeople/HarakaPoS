-- SMS Logs Table Migration
-- Run this in Supabase SQL Editor to enable SMS tracking

-- Create SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  event_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  task_id VARCHAR(100), -- TalkSasa task ID for tracking
  error TEXT,
  delivery_status VARCHAR(20), -- From webhook: Pending, Sent, Delivered, Failed, Rejected
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sms_logs_order_id ON sms_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- Enable RLS
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all SMS logs
CREATE POLICY "Admins can view SMS logs" ON sms_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: System can insert SMS logs (for server-side operations)
CREATE POLICY "System can insert SMS logs" ON sms_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update SMS logs (for webhook updates)
CREATE POLICY "System can update SMS logs" ON sms_logs
  FOR UPDATE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON sms_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sms_logs TO service_role;

-- Comment on table
COMMENT ON TABLE sms_logs IS 'Tracks all SMS notifications sent through TalkSasa';
COMMENT ON COLUMN sms_logs.task_id IS 'TalkSasa/Ladybird task ID returned on send';
COMMENT ON COLUMN sms_logs.event_type IS 'Notification type: order_confirmed, out_for_delivery, etc.';
COMMENT ON COLUMN sms_logs.delivery_status IS 'Status from TalkSasa webhook callback';
