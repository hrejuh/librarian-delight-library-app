import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Extend the default supabase types to add our custom RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T = any>(
      fn: 'direct_profile_lookup' | 'get_profile_by_id' | 'get_user_institution_id' | 'get_user_role' | 'approve_request_transaction',
      params?: object,
      options?: object
    ): { data: T; error: Error | null };
  }
}

// Use the same credentials as the original client
const SUPABASE_URL = "https://uqtzzmldwqmdmaqfwsuj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdHp6bWxkd3FtZG1hcWZ3c3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDM1MTQsImV4cCI6MjA2MTY3OTUxNH0.jxEGDkwtZA24gBpcmoCzaQ6dnWe7jy2X0YJczpPoJ3c";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); 