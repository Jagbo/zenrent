/**
 * Property Enrichment Service
 * 
 * This service handles the enrichment of property data from external APIs.
 * It checks if a property needs enrichment and fetches the data if needed.
 */

import { createClient } from '@supabase/supabase-js';
import { PropertyDataAPI } from '../lib/propertyDataApi';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../types/supabase';

// Supabase client with service role for background tasks
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Data types to enrich
const DATA_TYPES = [
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

// Function to extract house number from address
function extractHouseNumber(address: string): string {
  const match = address.match(/^(\d+)/);
  return match ? match[1] : '';
}

/**
 * Check if a property needs enrichment
 * @param propertyId - The ID of the property to check
 * @returns Object with status and missing data types
 */
export async function checkPropertyEnrichmentStatus(propertyId: string) {
  try {
    // Get existing enrichment data for the property
    const { data: existingData, error } = await supabaseAdmin
      .from('property_enrichment_data')
      .select('data_type')
      .eq('property_id', propertyId);
    
    if (error) {
      console.error('Error checking property enrichment status:', error);
      return { needsEnrichment: false, missingTypes: [] };
    }
    
    // Determine which data types are missing
    const existingTypes = existingData?.map(item => item.data_type) || [];
    const missingTypes = DATA_TYPES.filter(type => !existingTypes.includes(type));
    
    return {
      needsEnrichment: missingTypes.length > 0,
      missingTypes
    };
  } catch (error) {
    console.error('Error in checkPropertyEnrichmentStatus:', error);
    return { needsEnrichment: false, missingTypes: [] };
  }
}

/**
 * Save enrichment data to the database
 * @param propertyId - The ID of the property
 * @param dataType - The type of data being saved
 * @param data - The data to save
 * @returns Boolean indicating success
 */
async function saveEnrichmentData(propertyId: string, dataType: string, data: any) {
  try {
    const now = new Date().toISOString();
    // Calculate next update due date (30 days from now)
    const nextUpdateDue = new Date();
    nextUpdateDue.setDate(nextUpdateDue.getDate() + 30);
    
    const { error } = await supabaseAdmin
      .from('property_enrichment_data')
      .insert({
        id: uuidv4(),
        property_id: propertyId,
        data_type: dataType,
        data,
        last_updated: now,
        next_update_due: nextUpdateDue.toISOString(),
        source: 'PropertyData API'
      });
    
    if (error) {
      console.error(`Error saving ${dataType} data:`, error);
      return false;
    }
    
    console.log(`Successfully saved ${dataType} data for property ${propertyId}`);
    return true;
  } catch (error) {
    console.error(`Error in saveEnrichmentData for ${dataType}:`, error);
    return false;
  }
}

/**
 * Enrich a property with data from external APIs
 * @param propertyId - The ID of the property to enrich
 * @returns Boolean indicating success
 */
export async function enrichProperty(propertyId: string) {
  try {
    console.log(`Starting enrichment for property ${propertyId}`);
    
    // Get property details
    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .select('address, postcode, property_type, bedrooms, bathrooms')
      .eq('id', propertyId)
      .single();
    
    if (error || !property) {
      console.error(`Error fetching property ${propertyId}:`, error);
      return false;
    }
    
    // Check which data types need enrichment
    const { needsEnrichment, missingTypes } = await checkPropertyEnrichmentStatus(propertyId);
    
    if (!needsEnrichment) {
      console.log(`Property ${propertyId} already has all enrichment data.`);
      return true;
    }
    
    console.log(`Enriching property ${propertyId} with data types: ${missingTypes.join(', ')}`);
    
    // Extract property details
    const { address, postcode, property_type, bedrooms, bathrooms } = property;
    const propertyType = property_type || 'flat';
    const numBedrooms = bedrooms || 2;
    const houseNumber = extractHouseNumber(address);
    
    // Process each missing data type
    for (const dataType of missingTypes) {
      try {
        let data;
        
        switch (dataType) {
          case 'energy_efficiency':
            // Mock EPC data for now - would be replaced with actual API call
            data = {
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
              validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0],
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
            break;
            
          case 'neighborhood':
            data = await PropertyDataAPI.getNeighborhoodData(postcode);
            break;
            
          case 'flood_risk':
            data = await PropertyDataAPI.getFloodRisk(postcode);
            break;
            
          case 'council_tax':
            data = await PropertyDataAPI.getCouncilTaxInfo(postcode);
            break;
            
          case 'freeholds':
            data = await PropertyDataAPI.getFreeholds(postcode);
            break;
            
          case 'hmo_register':
            if (houseNumber) {
              data = await PropertyDataAPI.checkHmoRegister(postcode, houseNumber);
            } else {
              console.log(`Skipping HMO register for property ${propertyId} as no house number is available.`);
              continue;
            }
            break;
            
          case 'average_rents':
            data = await PropertyDataAPI.getAverageRents(postcode, propertyType, numBedrooms);
            break;
            
          case 'average_hmo_rents':
            data = await PropertyDataAPI.getAverageHmoRents(postcode, numBedrooms);
            break;
            
          case 'last_sold':
            if (houseNumber) {
              data = await PropertyDataAPI.getLastSold(postcode, houseNumber);
            } else {
              console.log(`Skipping last sold for property ${propertyId} as no house number is available.`);
              continue;
            }
            break;
            
          default:
            console.log(`Unknown data type: ${dataType}`);
            continue;
        }
        
        if (data) {
          await saveEnrichmentData(propertyId, dataType, data);
        }
      } catch (error) {
        console.error(`Error enriching property ${propertyId} with ${dataType}:`, error);
        // Continue with other data types even if one fails
      }
    }
    
    console.log(`Completed enrichment for property ${propertyId}`);
    return true;
  } catch (error) {
    console.error(`Error in enrichProperty for ${propertyId}:`, error);
    return false;
  }
}

/**
 * Enrich all properties for a user
 * @param userId - The ID of the user
 * @returns Boolean indicating success
 */
export async function enrichUserProperties(userId: string) {
  try {
    console.log(`Starting enrichment for user ${userId}`);
    
    // Get all properties for the user
    const { data: properties, error } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('user_id', userId);
    
    if (error) {
      console.error(`Error fetching properties for user ${userId}:`, error);
      return false;
    }
    
    if (!properties || properties.length === 0) {
      console.log(`No properties found for user ${userId}`);
      return true;
    }
    
    console.log(`Found ${properties.length} properties for user ${userId}`);
    
    // Enrich each property
    for (const property of properties) {
      await enrichProperty(property.id);
    }
    
    console.log(`Completed enrichment for all properties of user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error in enrichUserProperties for ${userId}:`, error);
    return false;
  }
}
