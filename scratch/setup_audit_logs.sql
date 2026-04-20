-- Run this in your Supabase SQL Editor to enable Audit Logs

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policy: All authenticated users can Read logs (for the Activity Feed)
CREATE POLICY "Enable read for all authenticated users" ON audit_logs
  FOR SELECT TO authenticated USING (true);

-- 4. Policy: All authenticated users can Insert logs
CREATE POLICY "Enable insert for all authenticated users" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Indexing for performance on the activity feed
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
