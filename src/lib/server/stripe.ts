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

// 単一プラン型サブスクリプション
// - Businessプランのみ販売（¥9,800/シート/月）
// - トークン制限なし（フェアユース、異常利用のみ段階制御）
// - チャット履歴: 6ヶ月保持
// - 30日返金保証
export const PLANS = {
  // 未契約状態（サブスクリプションなし）
  none: {
    name: "未契約",
    price: 0,
    priceId: null,
    features: [],
    limits: {
      tokensPerMonth: 0, // 利用不可
      membersPerOrg: 1,
      storageGb: 0,
      chatHistoryMonths: 0,
    },
  },
  // 有料プラン（これしか売らない）
  business: {
    name: "Business",
    price: 9800, // ¥9,800/シート/月
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS || null,
    features: [
      "REINS PDF OCR・物件理解",
      "顧客条件とのマッチング",
      "契約締結時の必要書類洗い出し（都道府県・市区町村対応）",
      "通常業務で十分な利用量（フェアユース）",
      "チャット履歴：6ヶ月保持",
      "30日返金保証",
    ],
    limits: {
      tokensPerMonth: -1, // 無制限（フェアユース、内部で異常利用のみ段階制御）
      membersPerOrg: -1, // 無制限
      storageGb: 100,
      chatHistoryMonths: 6,
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
