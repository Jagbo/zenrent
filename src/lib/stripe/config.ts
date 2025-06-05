// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  apiVersion: '2025-02-24.acacia' as const,
};

// Plan pricing configuration
export const PLAN_PRICING = {
  essential: {
    monthly: {
      amount: 1000, // £10.00 in pence
      priceId: process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID || 'price_essential_monthly',
    },
    annual: {
      amount: 9600, // £96.00 in pence (20% discount)
      priceId: process.env.STRIPE_ESSENTIAL_ANNUAL_PRICE_ID || 'price_essential_annual',
    },
  },
  standard: {
    monthly: {
      amount: 2000, // £20.00 in pence
      priceId: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID || 'price_standard_monthly',
    },
    annual: {
      amount: 19200, // £192.00 in pence (20% discount)
      priceId: process.env.STRIPE_STANDARD_ANNUAL_PRICE_ID || 'price_standard_annual',
    },
  },
  professional: {
    monthly: {
      amount: 3000, // £30.00 in pence
      priceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_professional_monthly',
    },
    annual: {
      amount: 28800, // £288.00 in pence (20% discount)
      priceId: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || 'price_professional_annual',
    },
  },
};

// Map Stripe price IDs to our internal plan IDs
export function getPlanIdFromPriceId(priceId: string): string {
  const priceToplanMap: Record<string, string> = {};
  
  // Build the mapping from our configuration
  Object.entries(PLAN_PRICING).forEach(([planId, pricing]) => {
    priceToplanMap[pricing.monthly.priceId] = planId;
    priceToplanMap[pricing.annual.priceId] = planId;
  });

  return priceToplanMap[priceId] || 'essential';
}

// Get price ID for a specific plan and billing interval
export function getPriceId(planId: keyof typeof PLAN_PRICING, interval: 'monthly' | 'annual'): string {
  return PLAN_PRICING[planId]?.[interval]?.priceId || PLAN_PRICING.essential.monthly.priceId;
}

// Get amount for a specific plan and billing interval
export function getPlanAmount(planId: keyof typeof PLAN_PRICING, interval: 'monthly' | 'annual'): number {
  return PLAN_PRICING[planId]?.[interval]?.amount || PLAN_PRICING.essential.monthly.amount;
} 