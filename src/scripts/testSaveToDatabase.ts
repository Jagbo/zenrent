/**
 * Test script for saving PropertyData API results to Supabase
 * 
 * This script:
 * 1. Creates a server-side Supabase client
 * 2. Fetches data from the PropertyData API endpoints
 * 3. Saves the data to Supabase in the property_enrichment_data table using property ID as the key
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { EnergyEfficiencyAPI } from '../lib/energyEfficiencyApi';
import { PropertyDataAPI } from '../lib/propertyDataApi';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test property details
const testPropertyId = "7a2e1487-f17b-4ceb-b6d1-56934589025b"; // Actual property ID from the database
const testAddress = "Flat 53, Fairlie house, 76 brunner road";
const testPostcode = "E17 7GA";
const testPropertyType = "flat";
const testBedrooms = 2;
const testBathrooms = 1;
const houseNumber = "76";

// Supabase API configuration
const supabaseUrl = 'https://njsmkqmhkhxemxoqnvmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc21rcW1oa2h4ZW14b3Fudm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjAyMDcsImV4cCI6MjA1Nzc5NjIwN30.cbPNuK8HyWE29dKx-yb1F_JAFli4nAdCePqs4CuR_c4';

console.log('Using Supabase URL:', supabaseUrl);

// Helper function for Supabase REST API calls
async function supabaseRestRequest(endpoint: string, options: any = {}) {
  const url = `${supabaseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey
  };
  
  if (options.upsert) {
    headers['Prefer'] = 'resolution=merge-duplicates';
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    return { data, error: response.ok ? null : data };
  } catch (error) {
    return { data: null, error };
  }
}

// Function to check if the property exists in the database
async function checkPropertyExists(propertyId: string): Promise<boolean> {
  console.log(`Checking if property with ID ${propertyId} exists...`);
  
  const { data, error } = await supabaseRestRequest(
    `/rest/v1/properties?id=eq.${propertyId}&select=id`
  );
  
  if (error) {
    console.error('Error checking if property exists:', error);
    return false;
  }
  
  const exists = Array.isArray(data) && data.length > 0;
  
  if (exists) {
    console.log(`Property with ID ${propertyId} exists`);
  } else {
    console.log(`Property with ID ${propertyId} not found`);
  }
  
  return exists;
}

// Function to save data to Supabase using the property_enrichment_data table
async function saveToDatabase(propertyId: string, dataType: string, data: any) {
  console.log(`Saving ${dataType} data to database for property ${propertyId}...`);
  
  try {
    // Check if property exists first
    const propertyExists = await checkPropertyExists(propertyId);
    if (!propertyExists) {
      console.error(`Cannot save data for non-existent property ID: ${propertyId}`);
      return false;
    }
    
    // Check if record already exists
    const { data: existingData, error: checkError } = await supabaseRestRequest(
      `/rest/v1/property_enrichment_data?property_id=eq.${propertyId}&data_type=eq.${dataType}&select=id`
    );
    
    const recordExists = Array.isArray(existingData) && existingData.length > 0;
    const recordId = recordExists && existingData[0] ? existingData[0].id : null;
    
    // Current timestamp for last_updated
    const now = new Date().toISOString();
    // Next update due in 30 days
    const nextUpdateDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Prepare the data to save
    const enrichmentData = {
      property_id: propertyId,
      data_type: dataType,
      data: data,
      last_updated: now,
      next_update_due: nextUpdateDue,
      source: 'PropertyData API'
    };
    
    let result;
    if (recordExists && recordId) {
      // Update existing record
      const { data: updatedData, error: updateError } = await supabaseRestRequest(
        `/rest/v1/property_enrichment_data?id=eq.${recordId}`,
        {
          method: 'PATCH',
          body: enrichmentData
        }
      );
      
      result = { data: updatedData, error: updateError };
      console.log(`Updated existing ${dataType} data for property ${propertyId}`);
    } else {
      // Insert new record
      const { data: insertedData, error: insertError } = await supabaseRestRequest(
        `/rest/v1/property_enrichment_data`,
        {
          method: 'POST',
          body: enrichmentData,
          upsert: false
        }
      );
      
      result = { data: insertedData, error: insertError };
      console.log(`Inserted new ${dataType} data for property ${propertyId}`);
    }
    
    if (result.error) {
      console.error(`Error saving ${dataType} data:`, result.error);
      return false;
    }
    
    console.log(`Successfully saved ${dataType} data to database for property ${propertyId}`);
    return true;
  } catch (error) {
    console.error(`Error saving ${dataType} data:`, error);
    return false;
  }
}

// Function to create a test property
async function createTestProperty() {
  console.log('Creating a test property...');
  
  // Generate a random UUID for user_id
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  // Generate a random property code
  const generatePropertyCode = () => {
    return 'TEST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  };
  
  const testProperty = {
    id: generateUUID(),
    user_id: generateUUID(), // Using a random UUID for testing
    property_code: generatePropertyCode(),
    address: testAddress,
    city: 'London',
    postcode: testPostcode,
    property_type: testPropertyType,
    bedrooms: testBedrooms,
    bathrooms: testBathrooms,
    is_furnished: true,
    status: 'test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: { is_test: true }
  };
  
  try {
    const { data, error } = await supabaseRestRequest(
      '/rest/v1/properties',
      {
        method: 'POST',
        body: testProperty
      }
    );
    
    if (error) {
      console.error('Error creating test property:', error);
      return null;
    }
    
    console.log('Test property created successfully:', data);
    return testProperty.id; // Return the generated ID
  } catch (error) {
    console.error('Error creating test property:', error);
    return null;
  }
}

// Function to find a test property
async function findTestProperty() {
  console.log('Finding a test property...');
  
  try {
    // First try to find a property with status='test'
    const { data, error } = await supabaseRestRequest(
      '/rest/v1/properties?status=eq.test&limit=1'
    );
    
    if (error) {
      console.error('Error finding test property:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log('Found test property:', data[0].id);
      return data[0].id;
    }
    
    console.log('No test property found, creating one...');
    return await createTestProperty();
  } catch (error) {
    console.error('Error finding test property:', error);
    return null;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('Starting database save tests...');
  
  try {
    // Find or create a test property
    const propertyId = await findTestProperty();
    if (!propertyId) {
      console.error('Could not find or create a test property. Aborting tests.');
      return false;
    }
    
    console.log(`Using property ID: ${propertyId} for tests.`);
    
    // Mock EPC data for testing
    const epcData = {
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
      recommendations: [
        {
          improvement: "Install solar panels",
          savingEstimate: "£250-£500",
          impact: "Medium"
        },
        {
          improvement: "Upgrade to LED lighting",
          savingEstimate: "£50-£100",
          impact: "Low"
        }
      ]
    };
    
    // Save EPC data
    const epcSuccess = await saveToDatabase(propertyId, 'energy_efficiency', epcData);
    
    // Fetch and save neighborhood data
    const neighborhoodData = await PropertyDataAPI.getNeighborhoodData(testPostcode);
    const neighborhoodSuccess = await saveToDatabase(propertyId, 'neighborhood', neighborhoodData);
    
    // Fetch and save flood risk data
    const floodRiskData = await PropertyDataAPI.getFloodRisk(testPostcode);
    const floodRiskSuccess = await saveToDatabase(propertyId, 'flood_risk', floodRiskData);
    
    // Fetch and save council tax data
    const councilTaxData = await PropertyDataAPI.getCouncilTaxInfo(testPostcode);
    const councilTaxSuccess = await saveToDatabase(propertyId, 'council_tax', councilTaxData);
    
    // Fetch and save freeholds data
    const freeholdsData = await PropertyDataAPI.getFreeholds(testPostcode);
    const freeholdsSuccess = await saveToDatabase(propertyId, 'freeholds', freeholdsData);
    
    // Fetch and save HMO register data
    const hmoData = await PropertyDataAPI.checkHmoRegister(testPostcode, houseNumber);
    const hmoRegisterSuccess = await saveToDatabase(propertyId, 'hmo_register', hmoData);
    
    // Fetch and save average rents data
    const rentsData = await PropertyDataAPI.getAverageRents(testPostcode, testPropertyType, testBedrooms);
    const averageRentsSuccess = await saveToDatabase(propertyId, 'average_rents', rentsData);
    
    // Fetch and save average HMO rents data
    const hmoRentsData = await PropertyDataAPI.getAverageHmoRents(testPostcode, testBedrooms);
    const averageHmoRentsSuccess = await saveToDatabase(propertyId, 'average_hmo_rents', hmoRentsData);
    
    // Fetch and save last sold data
    const lastSoldData = await PropertyDataAPI.getLastSold(testPostcode, houseNumber);
    const lastSoldSuccess = await saveToDatabase(propertyId, 'last_sold', lastSoldData);
    
    // Summary
    console.log('\n--- Database Save Test Summary ---');
    console.log(`Energy Efficiency: ${epcSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Neighborhood: ${neighborhoodSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Flood Risk: ${floodRiskSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Council Tax: ${councilTaxSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Freeholds: ${freeholdsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`HMO Register: ${hmoRegisterSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Average Rents: ${averageRentsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Average HMO Rents: ${averageHmoRentsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Last Sold: ${lastSoldSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    const overallSuccess = epcSuccess && neighborhoodSuccess && floodRiskSuccess && 
                           councilTaxSuccess && freeholdsSuccess && hmoRegisterSuccess && 
                           averageRentsSuccess && averageHmoRentsSuccess && lastSoldSuccess;
    
    console.log(`\nOverall Database Save Result: ${overallSuccess ? '✅ ALL SAVED SUCCESSFULLY' : '❌ SOME SAVES FAILED'}`);
    
    return overallSuccess;
  } catch (error) {
    console.error('Error running database save tests:', error);
    return false;
  }
}

// Run the tests
runTests().catch(console.error);
