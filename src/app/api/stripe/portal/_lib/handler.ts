import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getStripe } from "@/lib/server/stripe";
import { createSupabaseAdminClient } from "@/lib/db/admin";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";
import { portalRequestSchema } from "@/app/api/stripe/portal/_lib/validation";

const logger = createLogger("api.stripe.portal");

async function handlePortalImpl(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = portalRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { organizationId } = parsed.data;

    const stripe = getStripe();
    const supabase = createSupabaseAdminClient();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organizationId)
      .single();

    const subData = subscription as { stripe_customer_id: string | null } | null;

    if (!subData?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subData.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    logger.info("Portal session created", {
      name: "api.stripe.portal",
      userId: session.user.id,
      orgId: organizationId,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    logger.error("Portal error", {
      name: "api.stripe.portal",
      err: serializeError(error),
    });
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

export const handlePortal = withLog(handlePortalImpl, {
  name: "api.stripe.portal",
  pickArgs: ([req]) => ({
    method: req.method,
    urlLen: req.url.length,
  }),
  sampleInfoRate: 0,
});
