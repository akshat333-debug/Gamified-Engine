/**
 * Supabase Client Configuration
 * 
 * To enable auth, create frontend/.env.local with:
 * NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client only if env vars are set
// Create client only if env vars are set and valid
const isValidUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');

export const supabase: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;

if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    console.warn('⚠️ Invalid Supabase URL provided. Auth will be disabled.');
}

// Check if auth is configured
export const isAuthConfigured = !!supabase;

export default supabase;
