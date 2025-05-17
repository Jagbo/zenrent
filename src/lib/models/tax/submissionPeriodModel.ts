/**
 * Submission Period Model
 * 
 * This file contains the model for submission periods, which represent
 * the time periods for which tax submissions are required.
 */

import { createClient, PostgrestError } from '@supabase/supabase-js';
import { SubmissionPeriod, SubmissionPeriodType, SubmissionStatus } from './types';
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
 * Submission Period Model
 */
export class SubmissionPeriodModel {
  /**
   * Get all submission periods for a user
   */
  static async getByUserId(userId: string): Promise<{ data: SubmissionPeriod[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    
    return { data: data as SubmissionPeriod[] | null, error };
  }
  
  /**
   * Get upcoming submission periods for a user
   */
  static async getUpcoming(userId: string): Promise<{ data: SubmissionPeriod[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .select('*')
      .eq('user_id', userId)
      .eq('status', SubmissionStatus.PENDING)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
    
    return { data: data as SubmissionPeriod[] | null, error };
  }
  
  /**
   * Get overdue submission periods for a user
   */
  static async getOverdue(userId: string): Promise<{ data: SubmissionPeriod[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .select('*')
      .eq('user_id', userId)
      .eq('status', SubmissionStatus.PENDING)
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
    
    return { data: data as SubmissionPeriod[] | null, error };
  }
  
  /**
   * Get a submission period by ID
   */
  static async getById(id: string): Promise<{ data: SubmissionPeriod | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data: data as SubmissionPeriod | null, error };
  }
  
  /**
   * Create a new submission period
   */
  static async create(period: Omit<SubmissionPeriod, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: SubmissionPeriod | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .insert([period])
      .select()
      .single();
    
    return { data: data as SubmissionPeriod | null, error };
  }
  
  /**
   * Update a submission period
   */
  static async update(id: string, updates: Partial<SubmissionPeriod>): Promise<{ data: SubmissionPeriod | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data: data as SubmissionPeriod | null, error };
  }
  
  /**
   * Delete a submission period
   */
  static async delete(id: string): Promise<{ error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { error } = await supabase
      .from('submission_periods')
      .delete()
      .eq('id', id);
    
    return { error };
  }
  
  /**
   * Get submission periods by tax year
   */
  static async getByTaxYear(userId: string, taxYear: string): Promise<{ data: SubmissionPeriod[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .select('*')
      .eq('user_id', userId)
      .eq('tax_year', taxYear)
      .order('start_date', { ascending: true });
    
    return { data: data as SubmissionPeriod[] | null, error };
  }
  
  /**
   * Get submission periods by type
   */
  static async getByType(userId: string, type: SubmissionPeriodType): Promise<{ data: SubmissionPeriod[] | null; error: PostgrestError | null }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .select('*')
      .eq('user_id', userId)
      .eq('submission_type', type)
      .order('start_date', { ascending: true });
    
    return { data: data as SubmissionPeriod[] | null, error };
  }
  
  /**
   * Generate submission periods for a tax year
   * This creates the quarterly or annual periods for a given tax year
   */
  static async generatePeriodsForTaxYear(
    userId: string, 
    taxYear: string, 
    type: SubmissionPeriodType = SubmissionPeriodType.QUARTERLY
  ): Promise<{ data: SubmissionPeriod[] | null; error: PostgrestError | null }> {
    // Parse tax year (format: "2023-2024")
    const [startYearStr, endYearStr] = taxYear.split('-');
    const startYear = parseInt(startYearStr);
    const endYear = parseInt(endYearStr);
    
    if (isNaN(startYear) || isNaN(endYear)) {
      return { 
        data: null, 
        error: { message: 'Invalid tax year format. Expected "YYYY-YYYY"', details: '', hint: '', code: '400' } 
      };
    }
    
    const periods: Omit<SubmissionPeriod, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    if (type === SubmissionPeriodType.QUARTERLY) {
      // Create quarterly periods (Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar)
      periods.push({
        userId,
        taxYear,
        submissionType: SubmissionPeriodType.QUARTERLY,
        status: SubmissionStatus.PENDING,
        startDate: `${startYear}-04-06`, // Apr 6
        endDate: `${startYear}-07-05`, // Jul 5
        dueDate: `${startYear}-08-05`, // Aug 5 (one month after period end)
        periodKey: `${taxYear}-Q1`
      });
      
      periods.push({
        userId,
        taxYear,
        submissionType: SubmissionPeriodType.QUARTERLY,
        status: SubmissionStatus.PENDING,
        startDate: `${startYear}-07-06`, // Jul 6
        endDate: `${startYear}-10-05`, // Oct 5
        dueDate: `${startYear}-11-05`, // Nov 5 (one month after period end)
        periodKey: `${taxYear}-Q2`
      });
      
      periods.push({
        userId,
        taxYear,
        submissionType: SubmissionPeriodType.QUARTERLY,
        status: SubmissionStatus.PENDING,
        startDate: `${startYear}-10-06`, // Oct 6
        endDate: `${startYear+1}-01-05`, // Jan 5
        dueDate: `${startYear+1}-02-05`, // Feb 5 (one month after period end)
        periodKey: `${taxYear}-Q3`
      });
      
      periods.push({
        userId,
        taxYear,
        submissionType: SubmissionPeriodType.QUARTERLY,
        status: SubmissionStatus.PENDING,
        startDate: `${startYear+1}-01-06`, // Jan 6
        endDate: `${startYear+1}-04-05`, // Apr 5
        dueDate: `${startYear+1}-05-05`, // May 5 (one month after period end)
        periodKey: `${taxYear}-Q4`
      });
    } else {
      // Create annual period
      periods.push({
        userId,
        taxYear,
        submissionType: SubmissionPeriodType.ANNUAL,
        status: SubmissionStatus.PENDING,
        startDate: `${startYear}-04-06`, // Apr 6
        endDate: `${startYear+1}-04-05`, // Apr 5 next year
        dueDate: `${startYear+1}-01-31`, // Jan 31 for self-assessment
        periodKey: `${taxYear}-A`
      });
    }
    
    // Insert the periods into the database
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('submission_periods')
      .insert(periods)
      .select();
    
    return { data: data as SubmissionPeriod[] | null, error };
  }
}
