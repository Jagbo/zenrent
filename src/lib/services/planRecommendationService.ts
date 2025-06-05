import { supabase } from '@/lib/supabase';

export interface PlanRecommendation {
  recommendedPlan: 'essential' | 'standard' | 'professional';
  currentPlan: string;
  upgradeRequired: boolean;
  propertyCount: number;
  hmoCount: number;
  isOnTrial: boolean;
  trialEndDate: string | null;
  reasons: string[];
}

export async function getPlanRecommendation(userId: string): Promise<PlanRecommendation> {
  
  try {
    // Get user profile with plan information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        plan_id,
        recommended_plan_id,
        plan_upgrade_required,
        subscription_status,
        is_trial_active,
        trial_end_date
      `)
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Get property counts using database function
    const { data: propertyData, error: propertyError } = await supabase
      .rpc('calculate_recommended_plan', { user_uuid: userId });

    if (propertyError) {
      throw new Error(`Failed to calculate plan: ${propertyError.message}`);
    }

    // Get property counts for display
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, is_hmo')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (propertiesError) {
      throw new Error(`Failed to fetch properties: ${propertiesError.message}`);
    }

    // Check trial status using database function
    const { data: trialStatus, error: trialError } = await supabase
      .rpc('is_user_on_trial', { user_uuid: userId });

    if (trialError) {
      throw new Error(`Failed to check trial status: ${trialError.message}`);
    }

    const propertyCount = properties?.length || 0;
    const hmoCount = properties?.filter(p => p.is_hmo).length || 0;
    const recommendedPlan = profile.recommended_plan_id || 'essential';
    
    // Generate reasons for the recommendation
    const reasons: string[] = [];
    
    if (propertyCount === 0) {
      reasons.push('No properties added yet - Essential plan is sufficient');
    } else if (propertyCount <= 2 && hmoCount === 0) {
      reasons.push(`${propertyCount} properties without HMO - Essential plan is sufficient`);
    } else if (propertyCount <= 2 && hmoCount > 0) {
      reasons.push(`${hmoCount} HMO property requires Standard plan or higher`);
    } else if (propertyCount <= 10) {
      reasons.push(`${propertyCount} properties requires Standard plan`);
    } else {
      reasons.push(`${propertyCount} properties requires Professional plan`);
    }

    if (hmoCount > 0) {
      reasons.push(`HMO properties require Standard plan or higher (Essential plan doesn't support HMO)`);
    }

    return {
      recommendedPlan: recommendedPlan as 'essential' | 'standard' | 'professional',
      currentPlan: profile.plan_id || 'essential',
      upgradeRequired: profile.plan_upgrade_required || false,
      propertyCount,
      hmoCount,
      isOnTrial: trialStatus || false,
      trialEndDate: profile.trial_end_date,
      reasons
    };

  } catch (error) {
    console.error('Error getting plan recommendation:', error);
    
    // Fallback to basic calculation if database functions fail
    return {
      recommendedPlan: 'essential',
      currentPlan: 'essential',
      upgradeRequired: false,
      propertyCount: 0,
      hmoCount: 0,
      isOnTrial: false,
      trialEndDate: null,
      reasons: ['Unable to calculate recommendation - please contact support']
    };
  }
}

export async function updateUserPlanRecommendation(userId: string): Promise<void> {
  
  try {
    const { error } = await supabase
      .rpc('update_user_plan_recommendation', { user_uuid: userId });

    if (error) {
      throw new Error(`Failed to update plan recommendation: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating plan recommendation:', error);
    throw error;
  }
}

// Helper function to get plan details
export function getPlanDetails(planId: string) {
  const plans = {
    essential: {
      name: 'Essential',
      price: 10,
      annualPrice: 96,
      features: ['Up to 2 properties', 'Basic features', 'No HMO support'],
      propertyLimit: 2,
      supportsHMO: false
    },
    standard: {
      name: 'Standard', 
      price: 20,
      annualPrice: 192,
      features: ['Up to 10 properties', 'Advanced features', 'HMO support'],
      propertyLimit: 10,
      supportsHMO: true
    },
    professional: {
      name: 'Professional',
      price: 30, 
      annualPrice: 288,
      features: ['Unlimited properties', 'All features', 'Priority support'],
      propertyLimit: Infinity,
      supportsHMO: true
    }
  };

  return plans[planId as keyof typeof plans] || plans.essential;
} 