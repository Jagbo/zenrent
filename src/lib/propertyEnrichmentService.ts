import { supabase } from "./supabase";
import { EnergyEfficiencyAPI } from "./energyEfficiencyApi";
import { PropertyDataAPI } from "./propertyDataApi";

// Define types for enrichment data
export interface EnrichmentData {
  property_id: string;
  data_type: string;
  data: any;
  last_updated: string;
  next_update_due: string;
  source: string;
}

// Check if data needs updating (doesn't exist or is stale)
const needsUpdate = async (propertyId: string, dataType: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("property_enrichment_data")
    .select("*")
    .eq("property_id", propertyId)
    .eq("data_type", dataType)
    .order("last_updated", { ascending: false })
    .limit(1);
    
  if (error || !data || data.length === 0) {
    console.log(`No existing ${dataType} data for property ${propertyId}`);
    return true;
  }
  
  // Check if data is stale (next_update_due has passed)
  const now = new Date();
  const nextUpdateDue = new Date(data[0].next_update_due);
  
  if (now > nextUpdateDue) {
    console.log(`${dataType} data for property ${propertyId} is stale, needs update`);
    return true;
  }
  
  console.log(`${dataType} data for property ${propertyId} is current, no update needed`);
  return false;
};

// Save enrichment data to database
const saveEnrichmentData = async (
  propertyId: string,
  dataType: string,
  data: any,
  source: string,
  updateFrequencyDays: number = 30
): Promise<void> => {
  if (!data) {
    console.log(`No data to save for ${dataType} for property ${propertyId}`);
    return;
  }
  
  const now = new Date();
  const nextUpdateDue = new Date();
  nextUpdateDue.setDate(now.getDate() + updateFrequencyDays);
  
  const { error } = await supabase
    .from("property_enrichment_data")
    .upsert({
      property_id: propertyId,
      data_type: dataType,
      data,
      last_updated: now.toISOString(),
      next_update_due: nextUpdateDue.toISOString(),
      source
    }, {
      onConflict: 'property_id,data_type'
    });
    
  if (error) {
    console.error(`Error saving ${dataType} data for property ${propertyId}:`, error);
    throw error;
  }
  
  console.log(`Successfully saved ${dataType} data for property ${propertyId}`);
};

// Fetch energy efficiency data using EPC API
export const fetchEnergyData = async (propertyId: string): Promise<void> => {
  if (!await needsUpdate(propertyId, 'energy')) return;
  
  try {
    // Get property details needed for energy API
    const { data: property, error } = await supabase
      .from("properties")
      .select("address, postcode")
      .eq("id", propertyId)
      .single();
      
    if (error || !property) {
      console.error(`Error fetching property details for energy data:`, error);
      return;
    }
    
    // Call EPC API
    const energyData = await EnergyEfficiencyAPI.getEnergyRating({
      address: property.address,
      postcode: property.postcode
    });
    
    if (energyData) {
      // Save to database - EPC certificates are valid for 10 years
      await saveEnrichmentData(propertyId, 'energy', energyData, 'EPC API', 365);
    }
  } catch (error) {
    console.error(`Error in fetchEnergyData for ${propertyId}:`, error);
  }
};

// Fetch property valuation using PropertyData API
export const fetchPropertyValuation = async (propertyId: string): Promise<void> => {
  if (!await needsUpdate(propertyId, 'valuation')) return;
  
  try {
    // Get property details needed for valuation API
    const { data: property, error } = await supabase
      .from("properties")
      .select("postcode, property_type, bedrooms, bathrooms, square_footage")
      .eq("id", propertyId)
      .single();
      
    if (error || !property) {
      console.error(`Error fetching property details for valuation:`, error);
      return;
    }
    
    // Call PropertyData valuation API
    const valuationData = await PropertyDataAPI.getValuation({
      postcode: property.postcode,
      propertyType: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.square_footage
    });
    
    // Save to database - update every 3 months for market values
    await saveEnrichmentData(propertyId, 'valuation', valuationData, 'PropertyData API', 90);
  } catch (error) {
    console.error(`Error in fetchPropertyValuation for ${propertyId}:`, error);
  }
};

// Fetch rental market data using PropertyData API
export const fetchRentalData = async (propertyId: string): Promise<void> => {
  if (!await needsUpdate(propertyId, 'rental')) return;
  
  try {
    // Get property details
    const { data: property, error } = await supabase
      .from("properties")
      .select("postcode, property_type, bedrooms")
      .eq("id", propertyId)
      .single();
      
    if (error || !property) {
      console.error(`Error fetching property details for rental data:`, error);
      return;
    }
    
    // Call PropertyData rental API
    const rentalData = await PropertyDataAPI.getRentalEstimate({
      postcode: property.postcode,
      propertyType: property.property_type,
      bedrooms: property.bedrooms
    });
    
    // Save to database - update every 2 months for rental market
    await saveEnrichmentData(propertyId, 'rental', rentalData, 'PropertyData API', 60);
  } catch (error) {
    console.error(`Error in fetchRentalData for ${propertyId}:`, error);
  }
};

// Fetch neighborhood data using PropertyData API
export const fetchNeighborhoodData = async (propertyId: string): Promise<void> => {
  if (!await needsUpdate(propertyId, 'neighborhood')) return;
  
  try {
    // Get property postcode
    const { data: property, error } = await supabase
      .from("properties")
      .select("postcode")
      .eq("id", propertyId)
      .single();
      
    if (error || !property) {
      console.error(`Error fetching property postcode for neighborhood data:`, error);
      return;
    }
    
    // Call PropertyData neighborhood API
    const neighborhoodData = await PropertyDataAPI.getNeighborhoodData(property.postcode);
    
    // Save to database - update every 6 months for demographic data
    await saveEnrichmentData(propertyId, 'neighborhood', neighborhoodData, 'PropertyData API', 180);
  } catch (error) {
    console.error(`Error in fetchNeighborhoodData for ${propertyId}:`, error);
  }
};

// Fetch flood risk data using PropertyData API
export const fetchFloodRiskData = async (propertyId: string): Promise<void> => {
  if (!await needsUpdate(propertyId, 'flood_risk')) return;
  
  try {
    // Get property postcode
    const { data: property, error } = await supabase
      .from("properties")
      .select("postcode")
      .eq("id", propertyId)
      .single();
      
    if (error || !property) {
      console.error(`Error fetching property postcode for flood risk data:`, error);
      return;
    }
    
    // Call PropertyData flood risk API
    const floodRiskData = await PropertyDataAPI.getFloodRisk(property.postcode);
    
    // Save to database - update yearly for environmental data
    await saveEnrichmentData(propertyId, 'flood_risk', floodRiskData, 'PropertyData API', 365);
  } catch (error) {
    console.error(`Error in fetchFloodRiskData for ${propertyId}:`, error);
  }
};

// Fetch property history using PropertyData API
export const fetchPropertyHistory = async (propertyId: string): Promise<void> => {
  if (!await needsUpdate(propertyId, 'property_history')) return;
  
  try {
    // Get property details
    const { data: property, error } = await supabase
      .from("properties")
      .select("address, postcode")
      .eq("id", propertyId)
      .single();
      
    if (error || !property) {
      console.error(`Error fetching property details for history data:`, error);
      return;
    }
    
    // Extract house number from address (if possible)
    const addressParts = property.address.split(' ');
    const houseNumber = addressParts[0].match(/^\d+/) ? addressParts[0] : undefined;
    
    // Call PropertyData history API
    const historyData = await PropertyDataAPI.getPropertyHistory(property.postcode, houseNumber);
    
    // Save to database - update every 6 months
    await saveEnrichmentData(propertyId, 'property_history', historyData, 'PropertyData API', 180);
  } catch (error) {
    console.error(`Error in fetchPropertyHistory for ${propertyId}:`, error);
  }
};

// Fetch council tax information using PropertyData API
export const fetchCouncilTaxData = async (propertyId: string): Promise<void> => {
  if (!await needsUpdate(propertyId, 'council_tax')) return;
  
  try {
    // Get property postcode
    const { data: property, error } = await supabase
      .from("properties")
      .select("postcode")
      .eq("id", propertyId)
      .single();
      
    if (error || !property) {
      console.error(`Error fetching property postcode for council tax data:`, error);
      return;
    }
    
    // Call PropertyData council tax API
    const councilTaxData = await PropertyDataAPI.getCouncilTaxInfo(property.postcode);
    
    // Save to database - update yearly for tax information
    await saveEnrichmentData(propertyId, 'council_tax', councilTaxData, 'PropertyData API', 365);
  } catch (error) {
    console.error(`Error in fetchCouncilTaxData for ${propertyId}:`, error);
  }
};

// Main function to enrich all properties for a user
export const enrichUserProperties = async (userId: string): Promise<void> => {
  console.log(`Starting property enrichment for user ${userId}`);
  
  try {
    // Get all properties for this user
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id")
      .eq("user_id", userId);
      
    if (error) {
      console.error(`Error fetching properties for user ${userId}:`, error);
      return;
    }
    
    if (!properties || properties.length === 0) {
      console.log(`No properties found for user ${userId}`);
      return;
    }
    
    console.log(`Found ${properties.length} properties for user ${userId}`);
    
    // Process each property in parallel
    await Promise.all(properties.map(async (property) => {
      const propertyId = property.id;
      
      // Run all enrichment processes
      await Promise.all([
        fetchEnergyData(propertyId),           // EPC API
        fetchPropertyValuation(propertyId),    // PropertyData API
        fetchRentalData(propertyId),           // PropertyData API
        fetchNeighborhoodData(propertyId),     // PropertyData API
        fetchFloodRiskData(propertyId),        // PropertyData API
        fetchPropertyHistory(propertyId),      // PropertyData API
        fetchCouncilTaxData(propertyId)        // PropertyData API
      ]);
      
      console.log(`Completed enrichment for property ${propertyId}`);
    }));
    
    console.log(`Completed property enrichment for all properties of user ${userId}`);
  } catch (error) {
    console.error(`Error in enrichUserProperties for user ${userId}:`, error);
  }
};

// Get enrichment data for a property
export const getPropertyEnrichmentData = async (propertyId: string): Promise<Record<string, any>> => {
  try {
    const { data, error } = await supabase
      .from("property_enrichment_data")
      .select("*")
      .eq("property_id", propertyId);
      
    if (error) {
      console.error(`Error fetching enrichment data for property ${propertyId}:`, error);
      return {};
    }
    
    // Convert array of records to object keyed by data_type
    return data.reduce((result: Record<string, any>, item) => {
      result[item.data_type] = item.data;
      return result;
    }, {});
  } catch (error) {
    console.error(`Error in getPropertyEnrichmentData for ${propertyId}:`, error);
    return {};
  }
};

// Rate limiting implementation for API calls
export const rateLimitedApiCall = async (fn: () => Promise<any>, retryCount = 0): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (error.message && error.message.includes('rate limit') && retryCount < 3) {
      // Exponential backoff: wait longer between each retry
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Rate limited, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return rateLimitedApiCall(fn, retryCount + 1);
    }
    throw error;
  }
};
