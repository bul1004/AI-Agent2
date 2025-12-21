import { createClient } from "@supabase/supabase-js";

// Admin client using service role key - bypasses RLS
// Only use in server-side code (API routes, webhooks)
// Note: Using untyped client for flexibility. For production, run:
// npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
export function createSupabaseAdminClient() {
  return createClient(
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

// Alias for compatibility
export const createAdminClient = createSupabaseAdminClient;
