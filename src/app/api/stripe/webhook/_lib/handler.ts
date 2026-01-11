import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/server/stripe";
import { createSupabaseAdminClient } from "@/lib/db/admin";
import type { PlanType } from "@/lib/server/stripe";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";
import type {
  CheckoutSessionData,
  StripeSubscriptionData,
} from "@/app/api/stripe/webhook/_lib/types";

const logger = createLogger("api.stripe.webhook");

async function handleStripeWebhookImpl(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    logger.error("Webhook signature verification failed", {
      name: "api.stripe.webhook.verify",
      err: serializeError(err),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as unknown as CheckoutSessionData;
      const organizationId = session.metadata?.organizationId;
      const plan = session.metadata?.plan as PlanType | undefined;
      const subscriptionId = session.subscription;

      if (!subscriptionId || !organizationId || !plan) break;

      const stripeSubResponse =
        await stripe.subscriptions.retrieve(subscriptionId);
      const stripeSub = stripeSubResponse as unknown as StripeSubscriptionData;

      await supabase
        .from("subscriptions")
        .update({
          stripeSubscriptionId: stripeSub.id,
          plan,
          status: "active",
          currentPeriodStart: stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000).toISOString()
            : null,
          currentPeriodEnd: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("organizationId", organizationId);

      logger.info("Checkout session completed", {
        name: "api.stripe.webhook",
        orgId: organizationId,
      });

      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as unknown as StripeSubscriptionData;
      const customerId = stripeSub.customer;

      if (!customerId) break;

      await supabase
        .from("subscriptions")
        .update({
          status: stripeSub.status,
          currentPeriodStart: stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000).toISOString()
            : null,
          currentPeriodEnd: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        })
        .eq("stripeCustomerId", customerId);

      logger.info("Subscription updated", {
        name: "api.stripe.webhook",
        stripeCustomerId: customerId,
      });

      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as unknown as StripeSubscriptionData;
      const customerId = stripeSub.customer;

      if (!customerId) break;

      // サブスクリプション解約 → 未契約状態に戻す
      await supabase
        .from("subscriptions")
        .update({
          plan: "none",
          status: "canceled",
          stripeSubscriptionId: null,
        })
        .eq("stripeCustomerId", customerId);

      logger.info("Subscription deleted", {
        name: "api.stripe.webhook",
        stripeCustomerId: customerId,
      });

      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const handleStripeWebhook = withLog(handleStripeWebhookImpl, {
  name: "api.stripe.webhook",
  pickArgs: ([req]) => ({
    method: req.method,
    urlLen: req.url.length,
  }),
  sampleInfoRate: 0,
});
