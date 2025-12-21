export interface StripeSubscriptionData {
  id: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  status?: string;
  customer?: string;
}

export interface CheckoutSessionData {
  subscription?: string;
  metadata?: Record<string, string>;
}
