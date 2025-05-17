/**
 * Tax Submission Model
 * 
 * This file contains the model for tax submissions, which represent
 * the actual tax submissions made to HMRC.
 */

import { createClient, PostgrestError } from '@supabase/supabase-js';
import { TaxSubmission, SubmissionStatus, CrystallisationStatus } from './types';
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
 * Tax Submission Model
 */
export class TaxSubmissionModel {
  /**
   * Get all tax submissions for a user
   */
  static async getByUserId(userId: string): Promise<{ data: TaxSubmission[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data: data as TaxSubmission[] | null, error };
  }
  
  /**
   * Get a tax submission by ID
   */
  static async getById(id: string): Promise<{ data: TaxSubmission | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data: data as TaxSubmission | null, error };
  }
  
  /**
   * Get tax submissions by period ID
   */
  static async getByPeriodId(periodId: string): Promise<{ data: TaxSubmission[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .select('*')
      .eq('period_id', periodId)
      .order('created_at', { ascending: false });
    
    return { data: data as TaxSubmission[] | null, error };
  }
  
  /**
   * Get tax submissions by tax year
   */
  static async getByTaxYear(userId: string, taxYear: string): Promise<{ data: TaxSubmission[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('tax_year', taxYear)
      .order('created_at', { ascending: false });
    
    return { data: data as TaxSubmission[] | null, error };
  }
  
  /**
   * Create a new tax submission
   */
  static async create(submission: Omit<TaxSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: TaxSubmission | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .insert([submission])
      .select()
      .single();
    
    return { data: data as TaxSubmission | null, error };
  }
  
  /**
   * Update a tax submission
   */
  static async update(id: string, updates: Partial<TaxSubmission>): Promise<{ data: TaxSubmission | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data: data as TaxSubmission | null, error };
  }
  
  /**
   * Delete a tax submission
   */
  static async delete(id: string): Promise<{ error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { error } = await supabase
      .from('tax_submissions')
      .delete()
      .eq('id', id);
    
    return { error };
  }
  
  /**
   * Get the latest tax submission for a period
   */
  static async getLatestForPeriod(periodId: string): Promise<{ data: TaxSubmission | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .select('*')
      .eq('period_id', periodId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return { data: data as TaxSubmission | null, error };
  }
  
  /**
   * Get submissions with a specific status
   */
  static async getByStatus(userId: string, status: SubmissionStatus): Promise<{ data: TaxSubmission[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    return { data: data as TaxSubmission[] | null, error };
  }
  
  /**
   * Update the submission status
   */
  static async updateStatus(id: string, status: SubmissionStatus, details?: any): Promise<{ data: TaxSubmission | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const updates: Partial<TaxSubmission> = { status };
    
    if (status === SubmissionStatus.SUBMITTED) {
      updates.submittedAt = new Date().toISOString();
    }
    
    if (details) {
      if (status === SubmissionStatus.ERROR || status === SubmissionStatus.REJECTED) {
        updates.errorDetails = details;
      } else if (status === SubmissionStatus.ACCEPTED) {
        updates.hmrcReference = details.reference;
      }
    }
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data: data as TaxSubmission | null, error };
  }
  
  /**
   * Update calculation data
   */
  static async updateCalculation(
    id: string, 
    calculationId: string, 
    calculationData: any
  ): Promise<{ data: TaxSubmission | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const updates: Partial<TaxSubmission> = {
      calculationId,
      calculationData,
      calculationTimestamp: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data: data as TaxSubmission | null, error };
  }
  
  /**
   * Update crystallisation status
   */
  static async updateCrystallisation(
    id: string, 
    status: CrystallisationStatus
  ): Promise<{ data: TaxSubmission | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const updates: Partial<TaxSubmission> = {
      crystallisationStatus: status
    };
    
    if (status === CrystallisationStatus.COMPLETED) {
      updates.crystallisationTimestamp = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('tax_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data: data as TaxSubmission | null, error };
  }
}
