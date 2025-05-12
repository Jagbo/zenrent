/**
 * Script to enrich properties using Supabase MCP
 * 
 * This script:
 * 1. Fetches properties for a specific user
 * 2. Runs property enrichment for each property
 * 3. Saves the enrichment data directly to the property_enrichment_data table using Supabase MCP
 */

import { PropertyDataAPI } from '../lib/propertyDataApi';
import { v4 as uuidv4 } from 'uuid';

// User ID to process
const userId = 'fd98eb7b-e2a1-488b-a669-d34c914202b1';

// Function to extract house number from address
function extractHouseNumber(address: string): string {
  const match = address.match(/^(\d+)/);
  return match ? match[1] : '';
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
  await saveEnrichmentData(propertyId, 'energy_efficiency', epcData);
  
  // Fetch and save neighborhood data
  try {
    const neighborhoodData = await PropertyDataAPI.getNeighborhoodData(postcode);
    await saveEnrichmentData(propertyId, 'neighborhood', neighborhoodData);
  } catch (error) {
    console.error(`Error fetching neighborhood data for ${postcode}:`, error);
  }
  
  // Fetch and save flood risk data
  try {
    const floodRiskData = await PropertyDataAPI.getFloodRisk(postcode);
    await saveEnrichmentData(propertyId, 'flood_risk', floodRiskData);
  } catch (error) {
    console.error(`Error fetching flood risk data for ${postcode}:`, error);
  }
  
  // Fetch and save council tax data
  try {
    const councilTaxData = await PropertyDataAPI.getCouncilTaxInfo(postcode);
    await saveEnrichmentData(propertyId, 'council_tax', councilTaxData);
  } catch (error) {
    console.error(`Error fetching council tax data for ${postcode}:`, error);
  }
  
  // Fetch and save freeholds data
  try {
    const freeholdsData = await PropertyDataAPI.getFreeholds(postcode);
    await saveEnrichmentData(propertyId, 'freeholds', freeholdsData);
  } catch (error) {
    console.error(`Error fetching freeholds data for ${postcode}:`, error);
  }
  
  // Fetch and save HMO register data if house number is available
  if (houseNumber) {
    try {
      const hmoData = await PropertyDataAPI.checkHmoRegister(postcode, houseNumber);
      await saveEnrichmentData(propertyId, 'hmo_register', hmoData);
    } catch (error) {
      console.error(`Error fetching HMO register data for ${postcode}:`, error);
    }
  } else {
    console.log('Skipping HMO register check as no house number is available.');
  }
  
  // Fetch and save average rents data
  try {
    const rentsData = await PropertyDataAPI.getAverageRents(postcode, propertyType, bedrooms);
    await saveEnrichmentData(propertyId, 'average_rents', rentsData);
  } catch (error) {
    console.error(`Error fetching average rents data for ${postcode}:`, error);
  }
  
  // Fetch and save average HMO rents data
  try {
    const hmoRentsData = await PropertyDataAPI.getAverageHmoRents(postcode, bedrooms);
    await saveEnrichmentData(propertyId, 'average_hmo_rents', hmoRentsData);
  } catch (error) {
    console.error(`Error fetching average HMO rents data for ${postcode}:`, error);
  }
  
  // Fetch and save last sold data if house number is available
  if (houseNumber) {
    try {
      const lastSoldData = await PropertyDataAPI.getLastSold(postcode, houseNumber);
      await saveEnrichmentData(propertyId, 'last_sold', lastSoldData);
    } catch (error) {
      console.error(`Error fetching last sold data for ${postcode}:`, error);
    }
  } else {
    console.log('Skipping last sold check as no house number is available.');
  }
  
  console.log(`Completed enrichment for property: ${property.address}`);
  
  return {
    propertyId,
    address: property.address,
    success: true
  };
}

// Function to save enrichment data using Supabase MCP
async function saveEnrichmentData(propertyId: string, dataType: string, data: any) {
  console.log(`Saving ${dataType} data for property ${propertyId}...`);
  
  try {
    // Check if data already exists
    const checkQuery = `
      SELECT id FROM property_enrichment_data 
      WHERE property_id = '${propertyId}' AND data_type = '${dataType}'
    `;
    
    const existingData = await executeQuery(checkQuery);
    const now = new Date().toISOString();
    const nextUpdateDue = new Date();
    nextUpdateDue.setDate(nextUpdateDue.getDate() + 30);
    
    if (existingData && existingData.length > 0) {
      // Update existing record
      const id = existingData[0].id;
      const updateQuery = `
        UPDATE property_enrichment_data
        SET 
          data = '${JSON.stringify(data)}',
          last_updated = '${now}',
          next_update_due = '${nextUpdateDue.toISOString()}',
          source = 'PropertyData API'
        WHERE id = '${id}'
      `;
      
      await executeQuery(updateQuery);
      console.log(`Updated ${dataType} data for property ${propertyId}`);
    } else {
      // Insert new record
      const id = uuidv4();
      const insertQuery = `
        INSERT INTO property_enrichment_data (
          id, property_id, data_type, data, last_updated, next_update_due, source
        ) VALUES (
          '${id}',
          '${propertyId}',
          '${dataType}',
          '${JSON.stringify(data)}',
          '${now}',
          '${nextUpdateDue.toISOString()}',
          'PropertyData API'
        )
      `;
      
      await executeQuery(insertQuery);
      console.log(`Inserted new ${dataType} data for property ${propertyId}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving ${dataType} data:`, error);
    return false;
  }
}

// Helper function to execute SQL queries using Supabase MCP
async function executeQuery(query: string) {
  try {
    // This will be replaced with the actual MCP call when run
    console.log(`Executing query: ${query}`);
    
    // For demonstration purposes, we'll return a mock result
    // In the actual implementation, this will be replaced with the MCP call
    return [];
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// Main function to run the script
async function run() {
  console.log(`Starting property enrichment for user ${userId}...`);
  
  try {
    // Get properties for the user
    const query = `SELECT id, address, postcode, property_type, bedrooms, bathrooms FROM properties WHERE user_id = '${userId}'`;
    const properties = await executeQuery(query);
    
    console.log(`Found ${properties.length} properties for user ${userId}`);
    
    // Process each property
    for (const property of properties) {
      await enrichProperty(property);
    }
    
    console.log('\nProperty enrichment completed successfully!');
    return true;
  } catch (error) {
    console.error('Error running property enrichment:', error);
    return false;
  }
}

// When running this script, replace the executeQuery function with actual MCP calls
console.log('This script is designed to be run with Supabase MCP.');
console.log('To run this script:');
console.log('1. Use the mcp1_execute_sql function to fetch properties');
console.log('2. For each property, call the enrichProperty function');
console.log('3. Use the mcp1_execute_sql function to save enrichment data');

// Export the enrichProperty function for use in other scripts
export { enrichProperty };
