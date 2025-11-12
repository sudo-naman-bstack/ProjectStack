import { createBrowserClient } from '@supabase/ssr'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from './database.types';

// The browser client is used in client components
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// The server client is used in server components and server actions
// It uses the service role key for elevated privileges.
export function createServerClient() {
    return createSupabaseServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: () => {},
          },
        }
    );
}
