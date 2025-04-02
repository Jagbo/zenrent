import { createClient } from '@supabase/supabase-js';
import getConfig from 'next/config';
import { supabase } from './supabase';

// Get runtime config
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {},
  publicRuntimeConfig: {}
};

// Create a Supabase client that uses service role key
const getDashboardClient = () => {
  const supabaseUrl = publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = serverRuntimeConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined!');
  }
  
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables!');
    console.log('Make sure SUPABASE_SERVICE_ROLE_KEY is defined in your .env.local file');
    
    // Use anon key as fallback
    console.log('Falling back to anon key instead of service role key');
    
    if (!supabaseAnonKey) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is also not defined!');
      throw new Error('No Supabase key available. Please check your environment variables.');
    }
    
    return createClient(
      supabaseUrl!,
      supabaseAnonKey!,
      { auth: { persistSession: false } }
    );
  }
  
  return createClient(
    supabaseUrl!,
    supabaseServiceKey!,
    { auth: { persistSession: false } }
  );
};

// Get the current authenticated user ID
export const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  return user.id;
};

export interface DashboardStats {
  totalProperties: number;
  expiringContracts: number;
  occupancyRate: number;
  currentMonthIncome: number;
}

export const getTotalProperties = async (userId: string): Promise<number> => {
  if (!userId) {
    throw new Error('User ID is required to fetch properties');
  }
  
  try {
    console.log(`Fetching total properties for user: ${userId}`);
    const { data, error } = await getDashboardClient()
      .from('properties')
      .select('id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching properties:', error);
      return 0;
    }

    console.log(`Retrieved ${data?.length || 0} properties`);
    return data?.length || 0;
  } catch (error) {
    console.error('Error fetching properties:', error);
    return 0;
  }
};

export const getExpiringContracts = async (userId: string): Promise<number> => {
  if (!userId) {
    throw new Error('User ID is required to fetch expiring contracts');
  }
  
  try {
    console.log(`Fetching expiring contracts for user: ${userId}`);
    
    // First get property IDs for this user
    let propertyIds: string[] = [];
    
    try {
      const { data: properties } = await getDashboardClient()
        .from('properties')
        .select('id')
        .eq('user_id', userId);
      
      if (properties && properties.length > 0) {
        propertyIds = properties.map(p => p.id);
        console.log(`Found ${propertyIds.length} properties for expiring contracts calculation`);
      } else {
        console.log('No properties found for user when fetching expiring contracts');
        return 0;
      }
    } catch (err) {
      console.error('Error fetching properties for expiring contracts:', err);
      return 0;
    }
    
    if (propertyIds.length === 0) {
      return 0;
    }
    
    // Now get leases for these properties
    try {
      const { data } = await getDashboardClient()
        .from('leases')
        .select('id')
        .in('property_id', propertyIds)
        .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .gte('end_date', new Date().toISOString());

      console.log(`Found ${data?.length || 0} expiring contracts`);
      return data?.length || 0;
    } catch (err) {
      console.error('Error fetching expiring contracts:', err);
      return 0;
    }
  } catch (error) {
    console.error('Error in getExpiringContracts:', error);
    return 0;
  }
};

export const getOccupancyRate = async (userId: string): Promise<number> => {
  if (!userId) {
    throw new Error('User ID is required to calculate occupancy rate');
  }
  
  try {
    console.log(`Calculating occupancy rate for user: ${userId}`);
    
    // Get all properties for this user
    const { data: properties, error: propertiesError } = await getDashboardClient()
      .from('properties')
      .select('id')
      .eq('user_id', userId);

    if (propertiesError) {
      console.error('Error fetching properties for occupancy rate:', propertiesError);
      return 0;
    }

    if (!properties?.length) {
      console.log('No properties found for calculating occupancy rate');
      return 0;
    }

    // Get active leases for these properties
    const propertyIds = properties.map(p => p.id);
    const { data: activeLeases, error: leasesError } = await getDashboardClient()
      .from('leases')
      .select('id')
      .in('property_id', propertyIds)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString());

    if (leasesError) {
      console.error('Error fetching leases for occupancy rate:', leasesError);
      return 0;
    }

    const rate = Math.round((activeLeases?.length || 0) / properties.length * 100);
    console.log(`Calculated occupancy rate: ${rate}%`);
    return rate;
  } catch (error) {
    console.error('Error calculating occupancy rate:', error);
    return 0;
  }
};

export const getCurrentMonthIncome = async (userId: string): Promise<number> => {
  if (!userId) {
    throw new Error('User ID is required to calculate current month income');
  }
  
  try {
    console.log(`Calculating current month income for user: ${userId}`);
    
    // Define month range
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    // Get properties for this user
    let propertyIds: string[] = [];
    
    try {
      const { data: properties } = await getDashboardClient()
        .from('properties')
        .select('id')
        .eq('user_id', userId);
      
      if (properties && properties.length > 0) {
        propertyIds = properties.map(p => p.id);
        console.log(`Found ${propertyIds.length} properties for monthly income calculation`);
      } else {
        console.log('No properties found for user when calculating monthly income');
        return 0;
      }
    } catch (err) {
      console.error('Error fetching properties for monthly income:', err);
      return 0;
    }
    
    if (propertyIds.length === 0) {
      return 0;
    }
    
    // Get leases for these properties
    try {
      const { data } = await getDashboardClient()
        .from('leases')
        .select('rent_amount')
        .in('property_id', propertyIds)
        .lte('start_date', endOfMonth.toISOString())
        .gte('end_date', startOfMonth.toISOString());

      const income = data?.reduce((sum, lease) => sum + (parseFloat(lease.rent_amount) || 0), 0) || 0;
      console.log(`Calculated current month income: £${income}`);
      return income;
    } catch (err) {
      console.error('Error fetching lease data for monthly income:', err);
      return 0;
    }
  } catch (error) {
    console.error('Error calculating current month income:', error);
    return 0;
  }
};

export const getDashboardStats = async (userId?: string): Promise<DashboardStats> => {
  if (!userId) {
    try {
      userId = await getCurrentUserId();
    } catch (error) {
      console.error('Error getting current user ID:', error);
      throw new Error('Authentication required: No user ID available');
    }
  }
  
  console.log(`Getting dashboard stats for user: ${userId}`);
  
  try {
    const response = await fetch(`/api/dashboard?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    
    const stats = await response.json();
    
    console.log('Dashboard stats retrieved:', stats);
    
    return stats;
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    // Return default values
    return {
      totalProperties: 0,
      expiringContracts: 0,
      occupancyRate: 0,
      currentMonthIncome: 0
    };
  }
};


