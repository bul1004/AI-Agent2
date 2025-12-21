"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  plugins: [
    organizationClient(),
    jwtClient(),
  ],
});

// Export direct methods for better ergonomics
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useActiveOrganization,
  useListOrganizations,
} = authClient;

// Organization namespace for methods that need it
export const organization = authClient.organization;

// JWT helper for Supabase client
export async function getSupabaseToken(): Promise<string | null> {
  try {
    const result = await authClient.getSession();
    if (!result.data?.session) {
      return null;
    }
    // Get JWT token for Supabase RLS
    const tokenResult = await authClient.$fetch("/api/auth/get-token");
    return (tokenResult as { token?: string })?.token || null;
  } catch {
    return null;
  }
}
