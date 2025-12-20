"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [organizationClient()],
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
