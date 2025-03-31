"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfileTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // For testing purposes, we'll use a fixed user ID in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setUserId('00000000-0000-0000-0000-000000000001');
    } else {
      // In production, get the actual user ID
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUserId(data.user.id);
        }
      });
    }
  }, []);
  
  // Test function to create a personal profile
  const testCreatePersonalProfile = async () => {
    if (!userId) {
      setError('No user ID available for testing');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Create test data for a personal profile
      const personalProfileData = {
        user_id: userId,
        profile_photo_url: 'https://example.com/test-photo.jpg',
        date_of_birth: '1990-01-01',
        address_line1: '123 Test Street',
        address_line2: 'Apartment 456',
        town_city: 'Test City',
        county: 'Test County',
        postcode: 'TE12 3ST',
        is_company: false,
        updated_at: new Date().toISOString()
      };
      
      // Clear any existing profile data for this test user
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.warn('Error clearing existing profile data:', deleteError);
        // Continue anyway
      }
      
      // Create the profile
      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert(personalProfileData)
        .select();
      
      if (insertError) {
        throw new Error(`Failed to create personal profile: ${insertError.message}`);
      }
      
      // Fetch the profile to verify
      const { data: fetchedProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (fetchError) {
        throw new Error(`Failed to fetch created profile: ${fetchError.message}`);
      }
      
      setResult(fetchedProfile);
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Test function to create a company profile
  const testCreateCompanyProfile = async () => {
    if (!userId) {
      setError('No user ID available for testing');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Directors for the test company
      const directors = [
        { id: '1', name: 'John Test', role: 'Director' },
        { id: '2', name: 'Jane Test', role: 'CEO' }
      ];
      
      // Create test data for a company profile
      const companyProfileData = {
        user_id: userId,
        profile_photo_url: 'https://example.com/test-company-logo.jpg',
        date_of_birth: null,
        address_line1: '123 Personal Address',
        address_line2: '',
        town_city: 'Personal City',
        county: 'Personal County',
        postcode: 'PE12 3ST',
        is_company: true,
        company_name: 'Test Company Ltd',
        company_registration_number: '12345678',
        vat_number: 'GB123456789',
        company_address_line1: '789 Company Road',
        company_address_line2: 'Floor 10',
        company_town_city: 'Business City',
        company_county: 'Business County',
        company_postcode: 'BC12 3DE',
        business_type: 'Limited Company',
        directors: JSON.stringify(directors),
        updated_at: new Date().toISOString()
      };
      
      // Clear any existing profile data for this test user
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.warn('Error clearing existing profile data:', deleteError);
        // Continue anyway
      }
      
      // Create the profile
      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert(companyProfileData)
        .select();
      
      if (insertError) {
        throw new Error(`Failed to create company profile: ${insertError.message}`);
      }
      
      // Fetch the profile to verify
      const { data: fetchedProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (fetchError) {
        throw new Error(`Failed to fetch created profile: ${fetchError.message}`);
      }
      
      setResult(fetchedProfile);
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 space-y-6">
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">User ID for Testing</h2>
        <p className="mb-4 font-mono bg-white p-2 rounded">{userId || 'Loading...'}</p>
        
        <div className="flex gap-4">
          <button
            onClick={testCreatePersonalProfile}
            disabled={loading || !userId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Personal Profile Creation'}
          </button>
          
          <button
            onClick={testCreateCompanyProfile}
            disabled={loading || !userId}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Company Profile Creation'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
          <h3 className="font-semibold">Success</h3>
          <pre className="mt-2 bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 