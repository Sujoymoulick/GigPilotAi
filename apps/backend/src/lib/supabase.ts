import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Service role admin client for database setup or background jobs that bypass RLS
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

// Get a Supabase client that utilizes the user's specific JWT token to respect RLS policies
export function getSupabaseUserClient(authToken?: string): SupabaseClient {
  if (!authToken) {
    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
      },
    },
  });
}
