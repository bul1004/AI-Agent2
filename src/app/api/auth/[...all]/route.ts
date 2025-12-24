import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { headers } from "next/headers";

const { GET: originalGET, POST: originalPOST } = toNextJsHandler(auth);

// #region agent log
async function logInviteMemberRequest(req: Request) {
  const url = new URL(req.url);
  if (!url.pathname.includes("invite-member")) return;

  const clonedReq = req.clone();
  let body: unknown = null;
  try {
    body = await clonedReq.json();
  } catch {
    body = "failed to parse";
  }

  // Get current session to check user permissions
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // Check member role in organization
  let memberRole: string | null = null;
  let existingInvitation: boolean = false;
  let existingMember: boolean = false;

  if (
    session?.session &&
    body &&
    typeof body === "object" &&
    "organizationId" in body &&
    "email" in body
  ) {
    const orgId = (body as Record<string, unknown>).organizationId as string;
    const email = (body as Record<string, unknown>).email as string;

    // Check inviter's role
    try {
      const memberResult = await auth.api.getActiveMember({
        headers: headersList,
      });
      memberRole = memberResult?.role ?? null;
    } catch {
      memberRole = "error_checking";
    }

    // Check if email already has invitation
    try {
      const invitations = await auth.api.listInvitations({
        headers: headersList,
        query: { organizationId: orgId },
      });
      existingInvitation =
        invitations?.some(
          (inv: { email: string; status: string }) =>
            inv.email === email && inv.status === "pending",
        ) ?? false;
    } catch {
      /* ignore */
    }

    // Check if email is already a member
    try {
      const members = await auth.api.listMembers({
        headers: headersList,
        query: { organizationId: orgId },
      });
      existingMember =
        members?.members?.some(
          (m: { user?: { email?: string } }) => m.user?.email === email,
        ) ?? false;
    } catch {
      /* ignore */
    }
  }

  fetch("http://127.0.0.1:7243/ingest/4e9d29cf-39a7-42c2-8ee8-7c2521fe874c", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "api/auth/[...all]/route.ts:POST",
      message: "invite-member detailed check",
      data: {
        pathname: url.pathname,
        body,
        hasSession: !!session?.session,
        userId: session?.user?.id,
        activeOrgId: (session?.session as Record<string, unknown>)
          ?.activeOrganizationId,
        activeOrgRole: (session?.session as Record<string, unknown>)
          ?.activeOrganizationRole,
        memberRole,
        existingInvitation,
        existingMember,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "B,E",
    }),
  }).catch(() => {});
}
// #endregion

export async function GET(req: Request) {
  return originalGET(req);
}

export async function POST(req: Request) {
  // #region agent log
  await logInviteMemberRequest(req);
  // #endregion
  return originalPOST(req);
}
