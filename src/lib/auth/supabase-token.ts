import { SignJWT } from "jose";
import type { Session } from "@/lib/auth/server";

const getSupabaseJwtSecret = (): Uint8Array => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

export async function createSupabaseAccessToken(session: Session): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 60 * 60; // 1 hour

  const activeOrganizationId =
    ((session.session as Record<string, unknown> | null)
      ?.activeOrganizationId as string | null) ?? session.user.id;
  const activeOrganizationRole =
    (session.session as Record<string, unknown> | null)
      ?.activeOrganizationRole as string | null | undefined;

  const orgRole = activeOrganizationRole
    ? `org:${activeOrganizationRole}`
    : null;

  const payload = {
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: "authenticated",
    aud: "authenticated",
    org_id: activeOrganizationId,
    org_role: orgRole,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(getSupabaseJwtSecret());
}
