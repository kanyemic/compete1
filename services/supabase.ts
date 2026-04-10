import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export const hasSupabaseEnv = (): boolean =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string
    );
  }

  return cachedClient;
};
