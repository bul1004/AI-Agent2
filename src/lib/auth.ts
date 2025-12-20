import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { Pool } from "pg";

// Use a dummy value during build time when env vars are not available
const isBuilding = process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "build-time-dummy-secret-replace-in-production",
  database: isBuilding 
    ? undefined 
    : new Pool({
        connectionString: process.env.SUPABASE_DB_URL,
      }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
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
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      creatorRole: "owner",
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      sendInvitationEmail: async ({ email, organization: org, inviter }) => {
        // TODO: Integrate with email service (Resend, SendGrid, etc.)
        const inviterEmail = inviter?.user?.email || "unknown";
        console.log(`[DEV] Invite ${email} to ${org.name} by ${inviterEmail}`);
        console.log(`[DEV] In production, send an email with the invite link`);
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session age every 1 day
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
