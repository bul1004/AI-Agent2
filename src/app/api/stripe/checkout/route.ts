import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getStripe, PLANS, type PlanType } from "@/lib/server/stripe";
import { createSupabaseAdminClient } from "@/lib/db/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, plan } = (await req.json()) as {
      organizationId: string;
      plan: PlanType;
    };

    const planConfig = PLANS[plan];
    if (!planConfig?.priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const stripe = getStripe();
    const supabase = createSupabaseAdminClient();

    // Check for existing Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organizationId)
      .single();

    // Type assertion for the data
    const subData = subscription as { stripe_customer_id: string | null } | null;
    let customerId = subData?.stripe_customer_id;

    // Create new customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          organizationId,
          userId: session.user.id,
        },
      });
      customerId = customer.id;

      // Upsert subscription record
      await supabase.from("subscriptions").upsert({
        organization_id: organizationId,
        stripe_customer_id: customerId,
        plan: "free",
        status: "active",
      });
    }

    // Create Checkout session
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      metadata: {
        organizationId,
        plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
