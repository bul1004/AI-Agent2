"use client";

import { createBrowserClient } from "@supabase/ssr";

// Note: Using untyped client for flexibility. For production, run:
// npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
