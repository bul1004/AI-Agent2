import "server-only";
import { betterAuth } from "better-auth";
import { customSession, organization, jwt } from "better-auth/plugins";
import { Pool } from "pg";
import { createAdminClient } from "@/lib/db/admin";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { sendInvitationEmail } from "@/lib/server/utils/invitation-email";

const sessionLogger = createLogger("auth.customSession");

/**
 * Get the last active organization ID from user record
 * This allows restoring the organization selection after sign-in
 */
async function getLastActiveOrganization(
  userId: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();

    // Get lastActiveOrganizationId from user table
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("lastActiveOrganizationId")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !userData?.lastActiveOrganizationId) {
      return null;
    }

    const lastOrgId = userData.lastActiveOrganizationId;

    // Verify user is still a member of that organization
    const { data: membership, error: memberError } = await supabase
      .from("member")
      .select("id")
      .eq("userId", userId)
      .eq("organizationId", lastOrgId)
      .maybeSingle();

    if (memberError || !membership) {
      sessionLogger.info("User no longer member of last organization", {
        name: "auth.session.restoreOrg",
        userId,
        lastOrgId,
      });
      // Clear the stale lastActiveOrganizationId
      await supabase
        .from("user")
        .update({ lastActiveOrganizationId: null })
        .eq("id", userId);
      return null;
    }

    sessionLogger.info("Restoring last active organization", {
      name: "auth.session.restoreOrg",
      userId,
      orgId: lastOrgId,
    });

    return lastOrgId;
  } catch (error) {
    sessionLogger.warn("Failed to get last active organization", {
      name: "auth.session.restoreOrg",
      userId,
      err: serializeError(error),
    });
    return null;
  }
}

/**
 * Save the active organization ID to user record
 * Called when user switches organizations
 */
async function saveLastActiveOrganization(
  userId: string,
  organizationId: string | null,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from("user")
      .update({ lastActiveOrganizationId: organizationId })
      .eq("id", userId);

    sessionLogger.info("Saved last active organization", {
      name: "auth.session.saveOrg",
      userId,
      orgId: organizationId,
    });
  } catch (error) {
    sessionLogger.warn("Failed to save last active organization", {
      name: "auth.session.saveOrg",
      userId,
      organizationId,
      err: serializeError(error),
    });
  }
}

async function resolveActiveOrganizationRole(params: {
  userId: string;
  activeOrganizationId?: string | null;
  activeOrganizationRole?: string | null;
}) {
  const { userId, activeOrganizationId, activeOrganizationRole } = params;

  // Respect existing role if present
  if (activeOrganizationRole || !activeOrganizationId) {
    return activeOrganizationRole ?? null;
  }

  // Personal account: treat as owner/admin equivalent
  if (activeOrganizationId === userId) {
    return "owner";
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("member")
      .select("role")
      .eq("userId", userId)
      .eq("organizationId", activeOrganizationId)
      .maybeSingle();

    if (error) {
      sessionLogger.warn("Failed to load active organization role", {
        name: "auth.customSession.activeOrgRole",
        userId,
        activeOrganizationId,
        err: serializeError(error),
      });
      return null;
    }

    return data?.role ?? null;
  } catch (error) {
    sessionLogger.warn("Exception while resolving organization role", {
      name: "auth.customSession.activeOrgRole",
      userId,
      activeOrganizationId,
      err: serializeError(error),
    });
    return null;
  }
}

// Use a dummy value during build time when env vars are not available
const isBuilding =
  process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET;

/**
 * BetterAuth server configuration
 * Handles authentication with Supabase RLS compatibility
 */
export const auth = betterAuth({
  // Database connection using Supabase PostgreSQL
  database: isBuilding
    ? undefined
    : new Pool({
        connectionString: process.env.SUPABASE_DB_URL,
      }),

  // Base URL for callbacks
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,

  // Secret for signing tokens
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "build-time-dummy-secret-replace-in-production",

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can enable later
  },

  // Social OAuth providers
  socialProviders: {
    google: process.env.GOOGLE_CLIENT_ID
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }
      : undefined,
    github: process.env.GITHUB_CLIENT_ID
      ? {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }
      : undefined,
  },

  // Account linking configuration
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github"],
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Database hooks for session management
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Restore last active organization when creating a new session
          sessionLogger.info("Session create hook triggered", {
            name: "auth.session.create.before",
            userId: session.userId,
          });
          const lastOrgId = await getLastActiveOrganization(session.userId);
          sessionLogger.info("Last org lookup result", {
            name: "auth.session.create.before",
            userId: session.userId,
            lastOrgId,
          });
          if (lastOrgId) {
            return {
              data: {
                ...session,
                activeOrganizationId: lastOrgId,
              },
            };
          }
          return { data: session };
        },
      },
      update: {
        after: async (session) => {
          // Save the active organization when session is updated
          const activeOrgId = (session as Record<string, unknown>)
            ?.activeOrganizationId as string | null;
          sessionLogger.info("Session update hook triggered", {
            name: "auth.session.update.after",
            userId: session.userId,
            activeOrgId,
          });
          // Save to user record for persistence across sign-in sessions
          await saveLastActiveOrganization(session.userId, activeOrgId);
        },
      },
    },
  },

  // Plugins
  plugins: [
    // Organization plugin for multi-tenant support
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days

      // Email invitation handler
      sendInvitationEmail: async ({
        email,
        organization: org,
        inviter,
        id,
      }) => {
        await sendInvitationEmail({
          email,
          invitationId: id,
          organizationName: org.name,
          inviterName: inviter.user?.name || null,
          inviterEmail: inviter.user?.email || null,
        });
      },
    }),

    // Enrich session response with active organization role for middleware / RLS
    customSession(async ({ session, user }) => {
      const resolvedRole = await resolveActiveOrganizationRole({
        userId: user.id,
        activeOrganizationId: (session as Record<string, unknown>)
          ?.activeOrganizationId as string | null,
        activeOrganizationRole: (session as Record<string, unknown>)
          ?.activeOrganizationRole as string | null,
      });

      return {
        session: {
          ...session,
          activeOrganizationRole: resolvedRole,
        },
        user,
      };
    }),

    // JWT plugin for Supabase RLS compatibility
    jwt({
      jwt: {
        expirationTime: "1h",

        // Custom payload for RLS compatibility
        definePayload: async ({ user, session }) => {
          const activeOrgId =
            ((session as Record<string, unknown>)?.activeOrganizationId as
              | string
              | null) || null;
          const activeOrgRole = await resolveActiveOrganizationRole({
            userId: user.id,
            activeOrganizationId: activeOrgId,
            activeOrganizationRole: (session as Record<string, unknown>)
              ?.activeOrganizationRole as string | null,
          });

          return {
            // Standard JWT claims
            sub: user.id,
            email: user.email,
            name: user.name,

            // Organization claims for Supabase RLS
            org_id: activeOrgId,
            org_role: activeOrgRole ? `org:${activeOrgRole}` : null,
          };
        },
      },
    }),
  ],

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    // Allow multiple localhost ports for development
    ...(process.env.NODE_ENV !== "production"
      ? [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "http://localhost:8000",
        ]
      : []),
  ],
});

// Export auth type for client usage
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
