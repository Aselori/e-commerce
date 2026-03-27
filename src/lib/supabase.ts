import { createBrowserClient, createServerClient } from "@supabase/ssr";
import * as SupabaseJS from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Admin client — server-only. Uses the service role key, bypasses RLS entirely.
 * NEVER import this in client components or expose the key to the browser.
 */
export function createAdminClient() {
  return SupabaseJS.createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Browser client — use in Client Components ("use client").
 * Creates a new instance on each call, but Supabase deduplicates internally.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Server client — use in Server Components, Route Handlers, and Server Actions.
 * Reads and writes cookies to persist the session across requests.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies are read-only.
            // The middleware handles session refresh in those cases.
          }
        },
      },
    }
  );
}
