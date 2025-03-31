"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TaxInfoTest() {
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
  
  // Test function to create tax information
  const testTaxInfo = async () => {
    if (!userId) {
      setError('No user ID available for testing');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Create test data for tax information
      const taxData = {
        user_id: userId,
        tax_status: 'individual',
        tax_reference_number: 'AB123456C',
        utr: '1234567890',
        mtd_status: 'enrolled',
        is_uk_tax_resident: true,
        is_non_resident_scheme: false,
        accounting_period: '2023-2024',
        updated_at: new Date().toISOString()
      };
      
      // Update the user profile with tax information
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(taxData);
      
      if (upsertError) {
        throw new Error(`Failed to update tax information: ${upsertError.message}`);
      }
      
      // Fetch the profile to verify
      const { data: fetchedProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (fetchError) {
        throw new Error(`Failed to fetch updated profile: ${fetchError.message}`);
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
        <h2 className="text-lg font-semibold mb-2">Test Tax Information Integration</h2>
        <p className="mb-4 font-mono bg-white p-2 rounded">{userId || 'Loading...'}</p>
        
        <button
          onClick={testTaxInfo}
          disabled={loading || !userId}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Tax Info Update'}
        </button>
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