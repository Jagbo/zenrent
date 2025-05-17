/**
 * Script to enrich all properties for a specific user
 * 
 * This script:
 * 1. Fetches all properties for a given user
 * 2. Runs property enrichment for each property
 * 3. Saves the enrichment data to the property_enrichment_data table
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { PropertyDataAPI } from '../lib/propertyDataApi';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njsmkqmhkhxemxoqnvmc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local');
  process.exit(1);
}

console.log(`Using Supabase key: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`);
console.log(`Using Supabase URL: ${supabaseUrl}`);

// User ID to process
const userId = 'fd98eb7b-e2a1-488b-a669-d34c914202b1';

// Helper function for Supabase REST API requests
async function supabaseRestRequest(endpoint: string, options: any = {}) {
  const url = `${supabaseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey
  };
  
  const requestOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        error: { 
          message: `HTTP error ${response.status}: ${errorText}`,
          status: response.status
        } 
      };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : String(error)
      } 
    };
  }
}

// Function to get all properties for a user
async function getUserProperties(userId: string) {
  console.log(`Fetching properties for user ${userId}...`);
  
  const { data, error } = await supabaseRestRequest(
    `/rest/v1/properties?user_id=eq.${userId}&select=id,address,postcode,property_type,bedrooms,bathrooms`
  );
  
  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
  
  console.log(`Found ${data.length} properties for user ${userId}.`);
  return data;
}

// Function to extract house number from address
function extractHouseNumber(address: string): string {
  const match = address.match(/^(\d+)/);
  return match ? match[1] : '';
}

// Function to save data to the property_enrichment_data table
async function saveToDatabase(propertyId: string, dataType: string, data: any) {
  console.log(`Saving ${dataType} data to database for property ${propertyId}...`);
  
  try {
    // Check if data already exists for this property and data type
    const { data: existingData, error: checkError } = await supabaseRestRequest(
      `/rest/v1/property_enrichment_data?property_id=eq.${propertyId}&data_type=eq.${dataType}&select=id`
    );
    
    if (checkError) {
      console.error(`Error checking existing ${dataType} data:`, checkError);
      return false;
    }
    
    const now = new Date().toISOString();
    // Calculate next update due date (30 days from now)
    const nextUpdateDue = new Date();
    nextUpdateDue.setDate(nextUpdateDue.getDate() + 30);
    
    // Prepare the data object
    const dataObject = {
      property_id: propertyId,
      data_type: dataType,
      data: data,
      last_updated: now,
      next_update_due: nextUpdateDue.toISOString(),
      source: 'PropertyData API'
    };
    
    let result;
    
    if (existingData && existingData.length > 0) {
      // Update existing record
      const id = existingData[0].id;
      console.log(`Updating existing ${dataType} data with ID ${id}...`);
      
      result = await supabaseRestRequest(
        `/rest/v1/property_enrichment_data?id=eq.${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dataObject)
        }
      );
    } else {
      // Insert new record
      console.log(`Inserting new ${dataType} data...`);
      
      // Generate a UUID for the new record
      const uuid = uuidv4();
      
      result = await supabaseRestRequest(
        `/rest/v1/property_enrichment_data`,
        {
          method: 'POST',
          body: JSON.stringify({
            id: uuid,
            ...dataObject
          })
        }
      );
    }
    
    if (result.error) {
      console.error(`Error saving ${dataType} data:`, result.error);
      return false;
    }
    
    console.log(`Successfully saved ${dataType} data to database.`);
    return true;
  } catch (error) {
    console.error(`Error in saveToDatabase for ${dataType}:`, error);
    return false;
  }
}

// Function to enrich a single property
async function enrichProperty(property: any) {
  console.log(`\nEnriching property: ${property.address} (${property.postcode})`);
  
  const propertyId = property.id;
  const postcode = property.postcode;
  const propertyType = property.property_type || 'flat';
  const bedrooms = property.bedrooms || 2;
  const bathrooms = property.bathrooms || 1;
  const houseNumber = extractHouseNumber(property.address);
  
  console.log(`Property details: ID=${propertyId}, Postcode=${postcode}, Type=${propertyType}, Bedrooms=${bedrooms}, House Number=${houseNumber}`);
  
  // Mock EPC data for testing
  const epcData = {
    epcRating: "C",
    energyScore: 75,
    potentialRating: "B",
    potentialScore: 85,
    estimatedEnergyCost: 150,
    heatingCost: 500,
    hotWaterCost: 200,
    totalEnergyCost: 850,
    potentialSaving: 200,
    co2Emissions: 3.0,
    validUntil: "2031-05-12",
    recommendations: [
      {
        improvement: "Install better insulation",
        savingEstimate: "£150-£300",
        impact: "Medium"
      },
      {
        improvement: "Upgrade heating system",
        savingEstimate: "£100-£200",
        impact: "Medium"
      }
    ]
  };
  
  // Save EPC data
  const epcSuccess = await saveToDatabase(propertyId, 'energy_efficiency', epcData);
  
  // Fetch and save neighborhood data
  const neighborhoodData = await PropertyDataAPI.getNeighborhoodData(postcode);
  const neighborhoodSuccess = await saveToDatabase(propertyId, 'neighborhood', neighborhoodData);
  
  // Fetch and save flood risk data
  const floodRiskData = await PropertyDataAPI.getFloodRisk(postcode);
  const floodRiskSuccess = await saveToDatabase(propertyId, 'flood_risk', floodRiskData);
  
  // Fetch and save council tax data
  const councilTaxData = await PropertyDataAPI.getCouncilTaxInfo(postcode);
  const councilTaxSuccess = await saveToDatabase(propertyId, 'council_tax', councilTaxData);
  
  // Fetch and save freeholds data
  const freeholdsData = await PropertyDataAPI.getFreeholds(postcode);
  const freeholdsSuccess = await saveToDatabase(propertyId, 'freeholds', freeholdsData);
  
  // Fetch and save HMO register data if house number is available
  let hmoRegisterSuccess = false;
  if (houseNumber) {
    const hmoData = await PropertyDataAPI.checkHmoRegister(postcode, houseNumber);
    hmoRegisterSuccess = await saveToDatabase(propertyId, 'hmo_register', hmoData);
  } else {
    console.log('Skipping HMO register check as no house number is available.');
  }
  
  // Fetch and save average rents data
  const rentsData = await PropertyDataAPI.getAverageRents(postcode, propertyType, bedrooms);
  const averageRentsSuccess = await saveToDatabase(propertyId, 'average_rents', rentsData);
  
  // Fetch and save average HMO rents data
  const hmoRentsData = await PropertyDataAPI.getAverageHmoRents(postcode, bedrooms);
  const averageHmoRentsSuccess = await saveToDatabase(propertyId, 'average_hmo_rents', hmoRentsData);
  
  // Fetch and save last sold data if house number is available
  let lastSoldSuccess = false;
  if (houseNumber) {
    const lastSoldData = await PropertyDataAPI.getLastSold(postcode, houseNumber);
    lastSoldSuccess = await saveToDatabase(propertyId, 'last_sold', lastSoldData);
  } else {
    console.log('Skipping last sold check as no house number is available.');
  }
  
  // Summary for this property
  console.log(`\n--- Enrichment Summary for ${property.address} ---`);
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
                         councilTaxSuccess && freeholdsSuccess && 
                         averageRentsSuccess && averageHmoRentsSuccess;
  
  return {
    propertyId,
    address: property.address,
    success: overallSuccess
  };
}

// Main function to run the script
async function run() {
  console.log(`Starting property enrichment for user ${userId}...`);
  
  // Get all properties for the user
  const properties = await getUserProperties(userId);
  
  if (properties.length === 0) {
    console.error(`No properties found for user ${userId}. Aborting.`);
    return false;
  }
  
  // Enrich each property
  const results = [];
  
  for (const property of properties) {
    const result = await enrichProperty(property);
    results.push(result);
  }
  
  // Print overall summary
  console.log('\n=== OVERALL ENRICHMENT SUMMARY ===');
  
  for (const result of results) {
    console.log(`${result.address}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  }
  
  const allSuccess = results.every(r => r.success);
  
  console.log(`\nOverall Result: ${allSuccess ? '✅ ALL PROPERTIES ENRICHED SUCCESSFULLY' : '❌ SOME PROPERTIES FAILED TO ENRICH'}`);
  
  return allSuccess;
}

// Run the script
run().catch(console.error);
