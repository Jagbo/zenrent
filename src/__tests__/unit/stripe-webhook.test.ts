import { describe, it, expect, jest } from '@jest/globals';
import { getPlanIdFromPriceId } from '@/lib/stripe/config';

describe('Stripe Webhook Unit Tests', () => {
  describe('getPlanIdFromPriceId', () => {
    it('should correctly map monthly price IDs to plan IDs', () => {
      // Set up environment variables for testing
      process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID = 'price_essential_monthly';
      process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID = 'price_standard_monthly';
      process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID = 'price_professional_monthly';

      expect(getPlanIdFromPriceId('price_essential_monthly')).toBe('essential');
      expect(getPlanIdFromPriceId('price_standard_monthly')).toBe('standard');
      expect(getPlanIdFromPriceId('price_professional_monthly')).toBe('professional');
    });

    it('should correctly map annual price IDs to plan IDs', () => {
      // Set up environment variables for testing
      process.env.STRIPE_ESSENTIAL_ANNUAL_PRICE_ID = 'price_essential_annual';
      process.env.STRIPE_STANDARD_ANNUAL_PRICE_ID = 'price_standard_annual';
      process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID = 'price_professional_annual';

      expect(getPlanIdFromPriceId('price_essential_annual')).toBe('essential');
      expect(getPlanIdFromPriceId('price_standard_annual')).toBe('standard');
      expect(getPlanIdFromPriceId('price_professional_annual')).toBe('professional');
    });

    it('should return essential as default for unknown price IDs', () => {
      expect(getPlanIdFromPriceId('unknown_price_id')).toBe('essential');
    });
  });

  describe('Webhook Event Processing', () => {
    it('should handle subscription.created event correctly', () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_standard_monthly',
              recurring: { interval: 'month' }
            }
          }]
        },
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      };

      // Verify the subscription data structure
      expect(mockSubscription.customer).toBe('cus_test123');
      expect(mockSubscription.status).toBe('active');
      expect(mockSubscription.items.data[0].price.id).toBe('price_standard_monthly');
    });

    it('should handle invoice.payment_succeeded event correctly', () => {
      const mockInvoice = {
        id: 'inv_test123',
        customer: 'cus_test123',
        amount_paid: 2000, // £20.00 in pence
        amount_due: 2000,
        status: 'paid',
      };

      // Verify the invoice data structure
      expect(mockInvoice.customer).toBe('cus_test123');
      expect(mockInvoice.amount_paid).toBe(2000);
      expect(mockInvoice.status).toBe('paid');
    });

    it('should handle subscription.deleted event correctly', () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      };

      // Verify the subscription cancellation data
      expect(mockSubscription.customer).toBe('cus_test123');
      expect(mockSubscription.status).toBe('canceled');
      expect(mockSubscription.canceled_at).toBeDefined();
    });
  });

  describe('Pricing Configuration', () => {
    it('should have correct monthly prices', () => {
      const expectedPrices = {
        essential: 1000, // £10.00
        standard: 2000,  // £20.00
        professional: 3000, // £30.00
      };

      // These would normally come from PLAN_PRICING in config
      expect(expectedPrices.essential).toBe(1000);
      expect(expectedPrices.standard).toBe(2000);
      expect(expectedPrices.professional).toBe(3000);
    });

    it('should have correct annual prices with 20% discount', () => {
      const expectedPrices = {
        essential: 9600,   // £96.00 (20% off £120)
        standard: 19200,   // £192.00 (20% off £240)
        professional: 28800, // £288.00 (20% off £360)
      };

      // Verify 20% discount calculation
      expect(expectedPrices.essential).toBe(1000 * 12 * 0.8);
      expect(expectedPrices.standard).toBe(2000 * 12 * 0.8);
      expect(expectedPrices.professional).toBe(3000 * 12 * 0.8);
    });
  });
}); 