import { createClient } from '@supabase/supabase-js';

// [SECURITY NOTE]
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are intentionally
// public — the anon key is safe to expose as long as Row Level Security (RLS) is
// strictly enforced on every table in your Supabase project.
// NEVER use the Service Role Key on the client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
