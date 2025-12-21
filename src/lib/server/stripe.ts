import Stripe from "stripe";

// Lazy initialization to avoid build-time errors when env vars are not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility - but prefer getStripe() for lazy loading
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    })
  : (null as unknown as Stripe);

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      messagesPerMonth: 100,
      membersPerOrg: 3,
      storageGb: 1,
    },
  },
  pro: {
    name: "Pro",
    price: 2900, // ¥2,900/month
    priceId: process.env.STRIPE_PRICE_ID_PRO || null,
    limits: {
      messagesPerMonth: 10000,
      membersPerOrg: 20,
      storageGb: 50,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: 9800, // ¥9,800/month
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || null,
    limits: {
      messagesPerMonth: -1, // Unlimited
      membersPerOrg: -1, // Unlimited
      storageGb: 500,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan].limits;
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // Unlimited
  return current < limit;
}
