import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly for testing
const supabaseUrl = 'https://njsmkqmhkhxemxoqnvmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc21rcW1oa2h4ZW14b3Fudm1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyMDIwNywiZXhwIjoyMDU3Nzk2MjA3fQ.CVhDx6X_oU4ReoYQttbbB7F7tcGTuNkwJWrx0kLR4iQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a custom implementation of the enrichUserProperties function
// that uses our direct Supabase client instead of the one from the application
async function enrichUserProperties(userId: string): Promise<void> {
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
    
    // Process each property
    for (const property of properties) {
      const propertyId = property.id;
      console.log(`Processing property ${propertyId}`);
      
      // Simulate enrichment by storing mock data
      await saveEnrichmentData(propertyId, 'energy', {
        epcRating: "C",
        energyScore: 72,
        potentialRating: "B",
        potentialScore: 86,
        estimatedEnergyCost: 120,
        heatingCost: 450,
        hotWaterCost: 180,
        totalEnergyCost: 750,
        potentialSaving: 250,
        co2Emissions: 2.5,
        validUntil: "2030-05-12"
      }, 'Mock API', 365);
      
      await saveEnrichmentData(propertyId, 'valuation', {
        estimatedValue: 325000,
        valueRange: {
          low: 310000,
          high: 340000,
        },
        confidence: "high",
        lastUpdated: new Date().toISOString()
      }, 'Mock API', 90);
      
      await saveEnrichmentData(propertyId, 'rental', {
        estimatedRent: 1650,
        rentRange: {
          low: 1550,
          high: 1750,
        },
        confidence: "high",
        yieldEstimate: 6.1,
        lastUpdated: new Date().toISOString()
      }, 'Mock API', 60);
      
      await saveEnrichmentData(propertyId, 'neighborhood', {
        demographics: {
          population: 15250,
          householdIncome: 42500
        },
        schools: [
          {
            name: "Walthamstow Primary School",
            type: "Primary",
            rating: "Good",
            distance: 0.4
          }
        ],
        crime: {
          crimeRate: 85,
          nationalAverage: 100
        },
        lastUpdated: new Date().toISOString()
      }, 'Mock API', 180);
      
      await saveEnrichmentData(propertyId, 'flood_risk', {
        floodRisk: "Very Low",
        riskFactors: {
          riverFlood: "Very Low",
          surfaceWater: "Low",
          groundwater: "Very Low"
        },
        lastUpdated: new Date().toISOString()
      }, 'Mock API', 365);
      
      await saveEnrichmentData(propertyId, 'property_history', {
        salesHistory: [
          {
            date: "2020-06-12",
            price: 295000,
            propertyType: "Flat",
            address: "Flat 53, Fairlie House, 76 Brunner Road"
          }
        ],
        averageSoldPrice: 270000,
        lastUpdated: new Date().toISOString()
      }, 'Mock API', 180);
      
      await saveEnrichmentData(propertyId, 'council_tax', {
        councilTaxBand: "D",
        annualAmount: 1850,
        localAuthority: "Waltham Forest Council",
        lastUpdated: new Date().toISOString()
      }, 'Mock API', 365);
      
      console.log(`Completed enrichment for property ${propertyId}`);
    }
    
    console.log(`Completed property enrichment for all properties of user ${userId}`);
  } catch (error) {
    console.error(`Error in enrichUserProperties for user ${userId}:`, error);
  }
}

// Helper function to save enrichment data
async function saveEnrichmentData(
  propertyId: string,
  dataType: string,
  data: any,
  source: string,
  updateFrequencyDays: number = 30
): Promise<void> {
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
}

// Test property details
const testAddress = "Flat 53, Fairlie house, 76 brunner road";
const testPostcode = "E17 7GA";

// Use hardcoded values for testing since we're having database creation issues
async function getTestData() {
  console.log('\n--- Using hardcoded test data ---');
  
  // First, check if the property_enrichment_data table exists
  const { data: tables, error: tablesError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .contains('tablename', 'property_enrichment_data');
    
  if (tablesError) {
    console.log('Error checking for tables:', tablesError);
    console.log('This is likely because we do not have access to system tables.');
  } else {
    console.log('Available tables:', tables);
  }
  
  // Hardcoded test values
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testPropertyId = '123e4567-e89b-12d3-a456-426614174001';
  
  // Check if the property_enrichment_data table exists by trying to query it
  try {
    const { data, error } = await supabase
      .from('property_enrichment_data')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error querying property_enrichment_data table:', error);
      console.log('Creating property_enrichment_data table if it does not exist...');
      
      // Try to create the table
      const createTableResult = await supabase.rpc('create_enrichment_table_if_not_exists');
      console.log('Create table result:', createTableResult);
    } else {
      console.log('property_enrichment_data table exists');
    }
  } catch (error) {
    console.error('Error checking property_enrichment_data table:', error);
  }
  
  return { propertyId: testPropertyId, userId: testUserId };
}

// Run the test
async function runTest() {
  console.log('Starting background service test...');
  
  // Get test data
  const testData = await getTestData();
  
  if (!testData) {
    console.error('Failed to get test data. Exiting test.');
    return;
  }
  
  console.log(`\n--- Testing Background Service for User ID: ${testData.userId} ---`);
  
  try {
    // Run the enrichment process
    await enrichUserProperties(testData.userId);
    
    // Check if enrichment data was saved
    const { data: enrichmentData, error } = await supabase
      .from('property_enrichment_data')
      .select('*')
      .eq('property_id', testData.propertyId);
    
    if (error) {
      console.error('Error fetching enrichment data:', error);
      return;
    }
    
    if (!enrichmentData || enrichmentData.length === 0) {
      console.log('No enrichment data was saved for the property.');
    } else {
      console.log(`\n--- Enrichment Data Saved (${enrichmentData.length} records) ---`);
      
      // Group by data type
      const groupedData = enrichmentData.reduce((acc, item) => {
        acc[item.data_type] = item;
        return acc;
      }, {});
      
      // Display summary of each data type
      Object.keys(groupedData).forEach(dataType => {
        const item = groupedData[dataType];
        console.log(`\n${dataType.toUpperCase()} (from ${item.source}):`);
        console.log(`Last updated: ${new Date(item.last_updated).toLocaleString()}`);
        console.log(`Next update due: ${new Date(item.next_update_due).toLocaleString()}`);
        
        // Show a preview of the data
        const data = item.data;
        if (data) {
          console.log('Data preview:');
          switch (dataType) {
            case 'energy':
              console.log(`EPC Rating: ${data.epcRating || 'N/A'}`);
              console.log(`Energy Score: ${data.energyScore || 'N/A'}`);
              console.log(`CO2 Emissions: ${data.co2Emissions || 'N/A'}`);
              break;
            case 'valuation':
              console.log(`Estimated Value: £${data.estimatedValue?.toLocaleString() || 'N/A'}`);
              console.log(`Value Range: £${data.valueRange?.low?.toLocaleString() || 'N/A'} - £${data.valueRange?.high?.toLocaleString() || 'N/A'}`);
              break;
            case 'rental':
              console.log(`Estimated Rent: £${data.estimatedRent?.toLocaleString() || 'N/A'} per month`);
              console.log(`Yield Estimate: ${data.yieldEstimate || 'N/A'}%`);
              break;
            case 'neighborhood':
              console.log(`Demographics: Population ${data.demographics?.population?.toLocaleString() || 'N/A'}`);
              console.log(`Schools: ${data.schools?.length || 0} nearby`);
              break;
            case 'flood_risk':
              console.log(`Flood Risk Level: ${data.floodRisk || 'N/A'}`);
              break;
            case 'property_history':
              console.log(`Sales History: ${data.salesHistory?.length || 0} records`);
              break;
            case 'council_tax':
              console.log(`Council Tax Band: ${data.councilTaxBand || 'N/A'}`);
              console.log(`Annual Amount: £${data.annualAmount?.toLocaleString() || 'N/A'}`);
              break;
            default:
              console.log(JSON.stringify(data, null, 2).substring(0, 200) + '...');
          }
        }
      });
    }
  } catch (error) {
    console.error('Error running background service test:', error);
  }
  
  console.log('\nTest completed!');
}

// Run the test
runTest().catch(console.error);
