/**
 * Simple test script to check Supabase access and permissions
 */

import fetch from 'node-fetch';

// Supabase configuration
const supabaseUrl = 'https://njsmkqmhkhxemxoqnvmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc21rcW1oa2h4ZW14b3Fudm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjAyMDcsImV4cCI6MjA1Nzc5NjIwN30.cbPNuK8HyWE29dKx-yb1F_JAFli4nAdCePqs4CuR_c4';

// Helper function for Supabase REST API calls
async function supabaseRequest(endpoint: string, options: any = {}) {
  const url = `${supabaseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };
  
  if (options.upsert) {
    headers['Prefer'] = 'resolution=merge-duplicates';
  }

  try {
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      console.error(`Error ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response: ${errorText}`);
      return { data: null, error: { status: response.status, message: errorText } };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Request error:', error);
    return { data: null, error };
  }
}

// List available tables
async function listTables() {
  console.log('Checking available tables...');
  
  try {
    // Try to access the property_enrichment_data table
    const { data: enrichmentData, error: enrichmentError } = await supabaseRequest(
      '/rest/v1/property_enrichment_data?limit=1'
    );
    
    console.log('Property Enrichment Data Access:', enrichmentError ? 'DENIED' : 'ALLOWED');
    if (enrichmentData) {
      console.log('Sample data:', JSON.stringify(enrichmentData, null, 2));
    }
    
    // Try to access the properties table
    const { data: propertiesData, error: propertiesError } = await supabaseRequest(
      '/rest/v1/properties?limit=1'
    );
    
    console.log('Properties Table Access:', propertiesError ? 'DENIED' : 'ALLOWED');
    if (propertiesData && propertiesData.length > 0) {
      console.log('Found property:', propertiesData[0].id);
      
      // If we found a property, try to save some test data
      if (propertiesData[0].id) {
        await testSaveEnrichmentData(propertiesData[0].id);
      }
    }
    
    // Try to get the user's properties
    const { data: userProperties, error: userPropertiesError } = await supabaseRequest(
      '/rest/v1/rpc/get_user_properties',
      {
        method: 'POST',
        body: {}
      }
    );
    
    console.log('User Properties Access:', userPropertiesError ? 'DENIED' : 'ALLOWED');
    if (userProperties && userProperties.length > 0) {
      console.log('User properties:', userProperties.map((p: any) => p.id));
      
      // If we found user properties, try to save some test data
      if (userProperties[0].id) {
        await testSaveEnrichmentData(userProperties[0].id);
      }
    }
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

// Test saving enrichment data
async function testSaveEnrichmentData(propertyId: string) {
  console.log(`Testing save enrichment data for property ${propertyId}...`);
  
  const testData = {
    epcRating: "B",
    energyScore: 85,
    potentialRating: "A",
    potentialScore: 92,
    estimatedEnergyCost: 120,
    heatingCost: 450,
    hotWaterCost: 180,
    totalEnergyCost: 750,
    potentialSaving: 250,
    co2Emissions: 2.5,
    validUntil: "2032-08-02",
    testTimestamp: new Date().toISOString()
  };
  
  // Check if record already exists
  const { data: existingData, error: checkError } = await supabaseRequest(
    `/rest/v1/property_enrichment_data?property_id=eq.${propertyId}&data_type=eq.test_data&select=id`
  );
  
  const recordExists = Array.isArray(existingData) && existingData.length > 0;
  const recordId = recordExists && existingData[0] ? existingData[0].id : null;
  
  console.log('Record exists:', recordExists, recordId ? `ID: ${recordId}` : '');
  
  // Current timestamp for last_updated
  const now = new Date().toISOString();
  // Next update due in 30 days
  const nextUpdateDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Prepare the data to save
  const enrichmentData = {
    property_id: propertyId,
    data_type: 'test_data',
    data: testData,
    last_updated: now,
    next_update_due: nextUpdateDue,
    source: 'Test Script'
  };
  
  let result;
  if (recordExists && recordId) {
    // Update existing record
    result = await supabaseRequest(
      `/rest/v1/property_enrichment_data?id=eq.${recordId}`,
      {
        method: 'PATCH',
        body: enrichmentData
      }
    );
    
    console.log('Update result:', result.error ? 'ERROR' : 'SUCCESS');
  } else {
    // Insert new record
    result = await supabaseRequest(
      '/rest/v1/property_enrichment_data',
      {
        method: 'POST',
        body: enrichmentData
      }
    );
    
    console.log('Insert result:', result.error ? 'ERROR' : 'SUCCESS');
  }
  
  if (result.error) {
    console.error('Error saving data:', result.error);
  } else {
    console.log('Successfully saved test data');
  }
}

// Run the test
listTables().catch(console.error);
