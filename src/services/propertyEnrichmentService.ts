/**
 * Property Enrichment Service
 * 
 * This service handles the enrichment of property data from external APIs.
 * It checks if a property needs enrichment and fetches the data if needed.
 */

import { PropertyDataAPI } from '../lib/propertyDataApi';
import { v4 as uuidv4 } from 'uuid';
import { EnergyEfficiencyAPI } from '../lib/energyEfficiencyApi';
import { supabase } from '@/lib/supabase';

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

// Define the structure for enrichment data
interface PropertyEnrichmentData {
  id?: string;
  property_id: string;
  data_type: string;
  data: any;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Check if a property needs enrichment
 * @param propertyId - The ID of the property to check
 * @returns Object with status and missing data types
 */
export async function checkPropertyEnrichmentStatus(propertyId: string) {
  try {
    // Get existing enrichment data for the property using RPC function
    const { data: existingData, error } = await supabase.rpc('get_property_enrichment_data', {
      p_property_id: propertyId,
      p_data_type: null // Get all data types for this property
    });
    
    if (error) {
      console.error('Error checking property enrichment status:', error);
      return { needsEnrichment: false, missingTypes: [] };
    }
    
    // Determine which data types are missing
    const existingTypes = existingData?.map((item: any) => item.data_type) || [];
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
 * Check if enrichment data already exists for a property and data type
 */
async function checkExistingData(propertyId: string, dataType: string): Promise<PropertyEnrichmentData | null> {
  try {
    const { data, error } = await supabase.rpc('get_property_enrichment_data', {
      p_property_id: propertyId,
      p_data_type: dataType
    });

    if (error) {
      console.error('Error checking existing enrichment data:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in checkExistingData:', error);
    return null;
  }
}

/**
 * Save enrichment data to the database
 */
async function saveEnrichmentData(propertyId: string, dataType: string, data: any, source: string): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.rpc('upsert_property_enrichment_data', {
      p_property_id: propertyId,
      p_data_type: dataType,
      p_data: data,
      p_source: source
    });

    if (error) {
      console.error('Error saving enrichment data:', error);
      return false;
    }

    return result === true;
  } catch (error) {
    console.error('Error in saveEnrichmentData:', error);
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
    const { data: property, error } = await supabase
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
            // Use actual PropertyData API for energy efficiency data
            try {
              console.log(`Fetching energy efficiency data for property ${propertyId} at ${address}, ${postcode}`);
              
              data = await EnergyEfficiencyAPI.getEnergyRating({
                address: address,
                postcode: postcode
              });
              
              if (!data) {
                console.log(`No energy efficiency data found for property ${propertyId}`);
                // Don't save null data - skip this data type
                continue;
              }
              
              console.log(`Successfully fetched energy efficiency data for property ${propertyId}:`, data);
              
            } catch (apiError) {
              console.error(`Error fetching energy efficiency data from PropertyData API:`, apiError);
              // Skip this data type if API call fails
              continue;
            }
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
            console.log(`Data type ${dataType} not yet implemented`);
            continue;
        }
        
        // Save the fetched data to database
        if (data) {
          const saved = await saveEnrichmentData(propertyId, dataType, data, 'PropertyData API');
          if (saved) {
            console.log(`Successfully saved ${dataType} data for property ${propertyId}`);
          } else {
            console.error(`Failed to save ${dataType} data for property ${propertyId}`);
          }
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
    const { data: properties, error } = await supabase
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

/**
 * Get enrichment data for a property
 * @param propertyId - The ID of the property
 * @returns Object with enrichment data keyed by data type
 */
export async function getPropertyEnrichmentData(propertyId: string): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.rpc('get_property_enrichment_data', {
      p_property_id: propertyId,
      p_data_type: null // Get all data types for this property
    });
    
    if (error) {
      console.error(`Error fetching enrichment data for property ${propertyId}:`, error);
      return {};
    }
    
    // Convert array of records to object keyed by data_type
    return data?.reduce((result: Record<string, any>, item: any) => {
      result[item.data_type] = item.data;
      return result;
    }, {}) || {};
  } catch (error) {
    console.error(`Error in getPropertyEnrichmentData for ${propertyId}:`, error);
    return {};
  }
}

/**
 * Get energy efficiency data for a property (client-safe version)
 * @param propertyId - The ID of the property
 * @returns Energy efficiency data or null if not available
 */
export async function getPropertyEnergyDataClient(propertyId: string): Promise<any | null> {
  try {
    // Use a simpler approach that works with client-side permissions
    const { data, error } = await supabase
      .from('property_enrichment_data')
      .select('data')
      .eq('property_id', propertyId)
      .eq('data_type', 'energy_efficiency')
      .single();
    
    if (error) {
      console.log(`No energy data found for property ${propertyId}:`, error.message);
      return null;
    }
    
    return data?.data || null;
  } catch (error) {
    console.error(`Error in getPropertyEnergyDataClient for ${propertyId}:`, error);
    return null;
  }
}
