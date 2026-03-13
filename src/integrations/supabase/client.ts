// IMPORTANT: Use the extended client from @/lib/supabase instead of this one
// This client has been replaced by @/lib/supabase.ts which has the necessary
// types for the custom RPC functions.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uqtzzmldwqmdmaqfwsuj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdHp6bWxkd3FtZG1hcWZ3c3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDM1MTQsImV4cCI6MjA2MTY3OTUxNH0.jxEGDkwtZA24gBpcmoCzaQ6dnWe7jy2X0YJczpPoJ3c";

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);