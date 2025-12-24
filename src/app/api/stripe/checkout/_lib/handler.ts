import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/db/admin";
import { getStripe, PLANS } from "@/lib/server/stripe";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";
import { checkoutRequestSchema } from "@/app/api/stripe/checkout/_lib/validation";

const logger = createLogger("api.stripe.checkout");

async function handleCheckoutImpl(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = checkoutRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { organizationId, plan, isPersonal } = parsed.data;

    // 個人モードの場合、organizationIdにはユーザーIDが入っている
    // 本人確認を行う
    if (isPersonal && organizationId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const planConfig = PLANS[plan];
    if (!planConfig?.priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const stripe = getStripe();
    const supabase = createSupabaseAdminClient();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organizationId)
      .single();

    const subData = subscription as {
      stripe_customer_id: string | null;
    } | null;
    let customerId = subData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          organizationId,
          userId: session.user.id,
          isPersonal: isPersonal ? "true" : "false",
        },
      });
      customerId = customer.id;

      // 初回は未契約状態で作成（checkoutSession完了時にbusinessに更新）
      await supabase.from("subscriptions").upsert({
        organization_id: organizationId,
        stripe_customer_id: customerId,
        plan: "none",
        status: "active",
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
      metadata: {
        organizationId,
        plan,
        isPersonal: isPersonal ? "true" : "false",
      },
    });

    logger.info("Checkout session created", {
      name: "api.stripe.checkout",
      userId: session.user.id,
      orgId: organizationId,
      isPersonal,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("Checkout error", {
      name: "api.stripe.checkout",
      err: serializeError(error),
    });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

export const handleCheckout = withLog(handleCheckoutImpl, {
  name: "api.stripe.checkout",
  pickArgs: ([req]) => ({
    method: req.method,
    urlLen: req.url.length,
  }),
  sampleInfoRate: 0,
});
