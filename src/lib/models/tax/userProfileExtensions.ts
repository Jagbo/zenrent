/**
 * User Profile Extensions for HMRC Integration
 * 
 * This file contains the extensions to the user profile model for HMRC integration.
 * It provides methods to update and retrieve HMRC-specific user data.
 */

import { createClient, PostgrestError } from '@supabase/supabase-js';
import { UserProfileMtdExtensions, MtdSubscriptionStatus, VatRegistrationDetails } from './types';
import { Database } from '@/lib/database.types';

/**
 * Create a Supabase client
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * User Profile HMRC Extensions Model
 */
export class UserProfileHmrcExtensions {
  /**
   * Get HMRC-specific user profile data
   */
  static async getHmrcData(userId: string): Promise<{ data: UserProfileMtdExtensions | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        hmrc_user_id,
        mtd_subscription_status,
        vat_registration_details,
        utr,
        mtd_status,
        tax_status,
        tax_reference_number,
        is_uk_tax_resident,
        is_non_resident_scheme,
        accounting_period
      `)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return { data: null, error };
    }
    
    // Transform snake_case database fields to camelCase for the interface
    const transformedData: UserProfileMtdExtensions = {
      hmrcUserId: data.hmrc_user_id,
      mtdSubscriptionStatus: (data.mtd_subscription_status as MtdSubscriptionStatus) || MtdSubscriptionStatus.NOT_SUBSCRIBED,
      vatRegistrationDetails: data.vat_registration_details as VatRegistrationDetails,
      utr: data.utr,
      mtdStatus: data.mtd_status,
      taxStatus: data.tax_status,
      taxReferenceNumber: data.tax_reference_number,
      isUkTaxResident: data.is_uk_tax_resident,
      isNonResidentScheme: data.is_non_resident_scheme,
      accountingPeriod: data.accounting_period
    };
    
    return { data: transformedData, error: null };
  }
  
  /**
   * Update HMRC-specific user profile data
   */
  static async updateHmrcData(
    userId: string, 
    updates: Partial<UserProfileMtdExtensions>
  ): Promise<{ data: UserProfileMtdExtensions | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    // Transform camelCase interface fields to snake_case for the database
    const dbUpdates: Record<string, any> = {};
    
    if (updates.hmrcUserId !== undefined) dbUpdates.hmrc_user_id = updates.hmrcUserId;
    if (updates.mtdSubscriptionStatus !== undefined) dbUpdates.mtd_subscription_status = updates.mtdSubscriptionStatus;
    if (updates.vatRegistrationDetails !== undefined) dbUpdates.vat_registration_details = updates.vatRegistrationDetails;
    if (updates.utr !== undefined) dbUpdates.utr = updates.utr;
    if (updates.mtdStatus !== undefined) dbUpdates.mtd_status = updates.mtdStatus;
    if (updates.taxStatus !== undefined) dbUpdates.tax_status = updates.taxStatus;
    if (updates.taxReferenceNumber !== undefined) dbUpdates.tax_reference_number = updates.taxReferenceNumber;
    if (updates.isUkTaxResident !== undefined) dbUpdates.is_uk_tax_resident = updates.isUkTaxResident;
    if (updates.isNonResidentScheme !== undefined) dbUpdates.is_non_resident_scheme = updates.isNonResidentScheme;
    if (updates.accountingPeriod !== undefined) dbUpdates.accounting_period = updates.accountingPeriod;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select(`
        hmrc_user_id,
        mtd_subscription_status,
        vat_registration_details,
        utr,
        mtd_status,
        tax_status,
        tax_reference_number,
        is_uk_tax_resident,
        is_non_resident_scheme,
        accounting_period
      `)
      .single();
    
    if (error || !data) {
      return { data: null, error };
    }
    
    // Transform snake_case database fields to camelCase for the interface
    const transformedData: UserProfileMtdExtensions = {
      hmrcUserId: data.hmrc_user_id,
      mtdSubscriptionStatus: (data.mtd_subscription_status as MtdSubscriptionStatus) || MtdSubscriptionStatus.NOT_SUBSCRIBED,
      vatRegistrationDetails: data.vat_registration_details as VatRegistrationDetails,
      utr: data.utr,
      mtdStatus: data.mtd_status,
      taxStatus: data.tax_status,
      taxReferenceNumber: data.tax_reference_number,
      isUkTaxResident: data.is_uk_tax_resident,
      isNonResidentScheme: data.is_non_resident_scheme,
      accountingPeriod: data.accounting_period
    };
    
    return { data: transformedData, error: null };
  }
  
  /**
   * Update HMRC user ID
   */
  static async updateHmrcUserId(
    userId: string, 
    hmrcUserId: string
  ): Promise<{ data: UserProfileMtdExtensions | null; error: PostgrestError | null }> {
    return this.updateHmrcData(userId, { hmrcUserId });
  }
  
  /**
   * Update MTD subscription status
   */
  static async updateMtdSubscriptionStatus(
    userId: string, 
    status: MtdSubscriptionStatus
  ): Promise<{ data: UserProfileMtdExtensions | null; error: PostgrestError | null }> {
    return this.updateHmrcData(userId, { mtdSubscriptionStatus: status });
  }
  
  /**
   * Update VAT registration details
   */
  static async updateVatRegistrationDetails(
    userId: string, 
    details: VatRegistrationDetails
  ): Promise<{ data: UserProfileMtdExtensions | null; error: PostgrestError | null }> {
    return this.updateHmrcData(userId, { vatRegistrationDetails: details });
  }
  
  /**
   * Check if a user is registered for MTD
   */
  static async isMtdRegistered(userId: string): Promise<boolean> {
    const { data, error } = await this.getHmrcData(userId);
    
    if (error || !data) {
      return false;
    }
    
    return data.mtdSubscriptionStatus === MtdSubscriptionStatus.SUBSCRIBED;
  }
  
  /**
   * Check if a user is registered for VAT
   */
  static async isVatRegistered(userId: string): Promise<boolean> {
    const { data, error } = await this.getHmrcData(userId);
    
    if (error || !data) {
      return false;
    }
    
    return !!data.vatRegistrationDetails?.vatNumber;
  }
}
