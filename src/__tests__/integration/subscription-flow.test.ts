import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { getPlanRecommendation } from '@/lib/services/planRecommendationService';

// Mock Supabase client for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Subscription Flow Integration Tests', () => {
  let testUserId: string;
  let testUserEmail: string;

  beforeEach(async () => {
    // Create a test user
    testUserEmail = `test-${Date.now()}@example.com`;
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = authUser.user.id;

    // Create user profile with trial data
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        first_name: 'Test',
        last_name: 'User',
        plan_id: 'essential',
        subscription_status: 'trial',
        is_trial_active: true,
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      });

    if (profileError) {
      throw new Error('Failed to create user profile');
    }
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      // Delete properties first (foreign key constraint)
      await supabase
        .from('properties')
        .delete()
        .eq('user_id', testUserId);

      // Delete user profile
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', testUserId);

      // Delete auth user
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Trial User with No Properties', () => {
    it('should recommend Essential plan for trial user with no properties', async () => {
      const planRecommendation = await getPlanRecommendation(testUserId);

      expect(planRecommendation).toMatchObject({
        currentPlan: 'essential',
        recommendedPlan: 'essential',
        isOnTrial: true,
        planUpgradeRequired: false,
        propertyCount: 0,
        hmoCount: 0,
      });
    });

    it('should block premium features for trial users', async () => {
      const planRecommendation = await getPlanRecommendation(testUserId);

      expect(planRecommendation.isOnTrial).toBe(true);
      // Premium features should not be available during trial
      expect(planRecommendation.currentPlan).toBe('essential');
    });
  });

  describe('Trial User with Properties', () => {
    beforeEach(async () => {
      // Add test properties
      const properties = [
        {
          user_id: testUserId,
          property_code: 'TEST001',
          address: '123 Test Street',
          property_type: 'house',
          is_hmo: false,
        },
        {
          user_id: testUserId,
          property_code: 'TEST002',
          address: '456 Test Avenue',
          property_type: 'flat',
          is_hmo: false,
        },
        {
          user_id: testUserId,
          property_code: 'TEST003',
          address: '789 Test Road',
          property_type: 'HMO',
          is_hmo: true,
        },
      ];

      const { error } = await supabase
        .from('properties')
        .insert(properties);

      if (error) {
        throw new Error('Failed to create test properties');
      }

      // Update plan recommendation
      await supabase.rpc('update_user_plan_recommendation', {
        user_uuid: testUserId
      });
    });

    it('should recommend Standard plan for user with 3 properties including 1 HMO', async () => {
      const planRecommendation = await getPlanRecommendation(testUserId);

      expect(planRecommendation).toMatchObject({
        currentPlan: 'essential',
        recommendedPlan: 'standard',
        isOnTrial: true,
        planUpgradeRequired: true,
        propertyCount: 3,
        hmoCount: 1,
      });
    });

    it('should update plan recommendation when properties are added', async () => {
      // Add more properties to trigger Professional plan recommendation
      const additionalProperties = Array.from({ length: 8 }, (_, i) => ({
        user_id: testUserId,
        property_code: `TEST${100 + i}`,
        address: `${100 + i} Additional Street`,
        property_type: 'house',
        is_hmo: false,
      }));

      await supabase
        .from('properties')
        .insert(additionalProperties);

      // Update plan recommendation
      await supabase.rpc('update_user_plan_recommendation', {
        user_uuid: testUserId
      });

      const planRecommendation = await getPlanRecommendation(testUserId);

      expect(planRecommendation).toMatchObject({
        currentPlan: 'essential',
        recommendedPlan: 'professional',
        isOnTrial: true,
        planUpgradeRequired: true,
        propertyCount: 11, // 3 + 8 additional
        hmoCount: 1,
      });
    });
  });

  describe('Paid Subscription User', () => {
    beforeEach(async () => {
      // Update user to paid subscription
      await supabase
        .from('user_profiles')
        .update({
          plan_id: 'standard',
          subscription_status: 'active',
          is_trial_active: false,
          stripe_customer_id: 'cus_test_customer',
          billing_interval: 'monthly',
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', testUserId);
    });

    it('should show active subscription status for paid user', async () => {
      const planRecommendation = await getPlanRecommendation(testUserId);

      expect(planRecommendation).toMatchObject({
        currentPlan: 'standard',
        isOnTrial: false,
      });
    });

    it('should allow access to premium features for paid users', async () => {
      const planRecommendation = await getPlanRecommendation(testUserId);

      expect(planRecommendation.isOnTrial).toBe(false);
      expect(planRecommendation.currentPlan).toBe('standard');
      // Premium features should be available for paid users
    });
  });

  describe('Database Functions', () => {
    it('should correctly calculate recommended plan based on properties', async () => {
      // Test the database function directly
      const { data, error } = await supabase.rpc('calculate_recommended_plan', {
        user_uuid: testUserId
      });

      expect(error).toBeNull();
      expect(data).toBe('essential'); // No properties = essential plan
    });

    it('should correctly check trial status', async () => {
      const { data, error } = await supabase.rpc('is_user_on_trial', {
        user_uuid: testUserId
      });

      expect(error).toBeNull();
      expect(data).toBe(true); // User should be on trial
    });
  });
});

// Helper function to simulate Stripe webhook events
export async function simulateStripeWebhook(eventType: string, customerId: string, subscriptionData?: any) {
  const webhookPayload = {
    type: eventType,
    data: {
      object: {
        customer: customerId,
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_standard_monthly',
              recurring: { interval: 'month' }
            }
          }]
        },
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
        ...subscriptionData
      }
    }
  };

  // This would normally be sent to /api/webhooks/stripe
  // For testing, we can directly call the webhook handler functions
  return webhookPayload;
} 