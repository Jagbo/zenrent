/**
 * Script to save property enrichment data to Supabase
 * 
 * This script:
 * 1. Loads property enrichment data from local JSON files
 * 2. Saves each data type to the property_enrichment_data table in Supabase
 * 3. Uses a valid property ID from the database
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

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

// Property ID to use for saving data
const propertyId = 'd2a69e47-b372-4b98-bb1e-717315e4001c'; // Flat 53 Fairlie House, E17 7GA

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

// Function to check if property exists
async function checkPropertyExists(propertyId: string): Promise<boolean> {
  console.log(`Checking if property with ID ${propertyId} exists...`);
  
  const { data, error } = await supabaseRestRequest(
    `/rest/v1/properties?id=eq.${propertyId}&select=id`
  );
  
  if (error) {
    console.error('Error checking property:', error);
    return false;
  }
  
  const exists = Array.isArray(data) && data.length > 0;
  
  if (exists) {
    console.log(`Property with ID ${propertyId} found.`);
  } else {
    console.log(`Property with ID ${propertyId} not found.`);
  }
  
  return exists;
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
      const uuid = crypto.randomUUID();
      
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

// Function to load data from a JSON file
function loadDataFromFile(dataType: string) {
  const filePath = path.join(__dirname, '..', '..', 'data', `${dataType}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return null;
  }
}

// Main function to run the script
async function run() {
  console.log('Starting to save property enrichment data to Supabase...');
  
  // Check if the property exists
  const propertyExists = await checkPropertyExists(propertyId);
  if (!propertyExists) {
    console.error(`Property with ID ${propertyId} does not exist. Aborting.`);
    return false;
  }
  
  // Data types to save
  const dataTypes = [
    'energy_efficiency',
    'neighborhood',
    'flood_risk',
    'council_tax',
    'freeholds',
    'hmo_register',
    'average_rents',
    'average_hmo_rents',
    'last_sold'
  ];
  
  // Save each data type
  const results = [];
  
  for (const dataType of dataTypes) {
    const data = loadDataFromFile(dataType);
    
    if (data) {
      const success = await saveToDatabase(propertyId, dataType, data);
      results.push({ dataType, success });
    } else {
      results.push({ dataType, success: false });
    }
  }
  
  // Print summary
  console.log('\n--- Save to Supabase Summary ---');
  
  let allSuccess = true;
  
  for (const result of results) {
    console.log(`${result.dataType}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!result.success) allSuccess = false;
  }
  
  console.log(`\nOverall Result: ${allSuccess ? '✅ ALL DATA SAVED SUCCESSFULLY' : '❌ SOME DATA FAILED TO SAVE'}`);
  
  return allSuccess;
}

// Run the script
run().catch(console.error);
