-- sql/create-system-settings.sql
-- Run this script in the Supabase SQL editor to create the system settings table

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read settings
CREATE POLICY "Allow authenticated read access" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

-- Create policy to allow all authenticated users to insert/update settings
CREATE POLICY "Allow authenticated write access" ON public.system_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Populate with default placeholders (optional)
INSERT INTO public.system_settings (key, value)
VALUES 
  ('line_backup_token', ''),
  ('line_backup_group_id', ''),
  ('fallback_email_to', '')
ON CONFLICT (key) DO NOTHING;
