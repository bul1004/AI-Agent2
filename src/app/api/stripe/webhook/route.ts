import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/server/stripe";
import { createSupabaseAdminClient } from "@/lib/db/admin";
import type { PlanType } from "@/lib/server/stripe";

// Helper to safely access subscription properties across Stripe SDK versions
interface StripeSubscriptionData {
  id: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  status?: string;
  customer?: string;
}

interface CheckoutSessionData {
  subscription?: string;
  metadata?: Record<string, string>;
}

export async function POST(req: NextRequest) {
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
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
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

      // Fetch subscription details
      const stripeSubResponse = await stripe.subscriptions.retrieve(subscriptionId);
      const stripeSub = stripeSubResponse as unknown as StripeSubscriptionData;

      await supabase
        .from("subscriptions")
        .update({
          stripe_subscription_id: stripeSub.id,
          plan,
          status: "active",
          current_period_start: stripeSub.current_period_start 
            ? new Date(stripeSub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("organization_id", organizationId);

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
          current_period_start: stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: stripeSub.cancel_at_period_end,
        })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as unknown as StripeSubscriptionData;
      const customerId = stripeSub.customer;

      if (!customerId) break;

      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
