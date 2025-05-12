import { createClient } from '@supabase/supabase-js';
import { EnergyEfficiencyAPI } from '../lib/energyEfficiencyApi';
import { PropertyDataAPI } from '../lib/propertyDataApi';

// Create Supabase client with hardcoded values for testing
const supabaseUrl = 'https://njsmkqmhkhxemxoqnvmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc21rcW1oa2h4ZW14b3Fudm1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyMDIwNywiZXhwIjoyMDU3Nzk2MjA3fQ.CVhDx6X_oU4ReoYQttbbB7F7tcGTuNkwJWrx0kLR4iQ';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Test environment setup complete');

// Test property details
const testAddress = "Flat 53, Fairlie house, 76 brunner road";
const testPostcode = "E17 7GA";

// Test EPC API
async function testEpcApi() {
  console.log('\n--- Testing EPC API ---');
  try {
    console.log(`Fetching EPC data for: ${testAddress}, ${testPostcode}`);
    const energyData = await EnergyEfficiencyAPI.getEnergyRating({
      address: testAddress,
      postcode: testPostcode
    });
    
    if (energyData) {
      console.log('EPC API Test: SUCCESS');
      console.log('Energy Rating:', energyData.epcRating);
      console.log('Energy Score:', energyData.energyScore);
      console.log('Total Energy Cost:', energyData.totalEnergyCost);
      console.log('CO2 Emissions:', energyData.co2Emissions);
    } else {
      console.log('EPC API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('EPC API Test: FAILED', error);
  }
}

// Test PropertyData API - Valuation
async function testPropertyValuation() {
  console.log('\n--- Testing PropertyData Valuation API ---');
  try {
    console.log(`Fetching valuation data for: ${testPostcode}`);
    const valuationData = await PropertyDataAPI.getValuation({
      postcode: testPostcode,
      propertyType: 'flat',
      bedrooms: 2,
      bathrooms: 1
    });
    
    if (valuationData) {
      console.log('Valuation API Test: SUCCESS');
      console.log('Estimated Value:', valuationData.estimatedValue);
      console.log('Value Range:', valuationData.valueRange);
      console.log('Confidence:', valuationData.confidence);
    } else {
      console.log('Valuation API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('Valuation API Test: FAILED', error);
  }
}

// Test PropertyData API - Rental
async function testRentalEstimate() {
  console.log('\n--- Testing PropertyData Rental API ---');
  try {
    console.log(`Fetching rental data for: ${testPostcode}`);
    const rentalData = await PropertyDataAPI.getRentalEstimate({
      postcode: testPostcode,
      propertyType: 'flat',
      bedrooms: 2
    });
    
    if (rentalData) {
      console.log('Rental API Test: SUCCESS');
      console.log('Estimated Rent:', rentalData.estimatedRent);
      console.log('Rent Range:', rentalData.rentRange);
      console.log('Yield Estimate:', rentalData.yieldEstimate);
    } else {
      console.log('Rental API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('Rental API Test: FAILED', error);
  }
}

// Test PropertyData API - Neighborhood
async function testNeighborhoodData() {
  console.log('\n--- Testing PropertyData Neighborhood API ---');
  try {
    console.log(`Fetching neighborhood data for: ${testPostcode}`);
    const neighborhoodData = await PropertyDataAPI.getNeighborhoodData(testPostcode);
    
    if (neighborhoodData) {
      console.log('Neighborhood API Test: SUCCESS');
      console.log('Demographics:', neighborhoodData.demographics);
      console.log('Schools Count:', neighborhoodData.schools?.length || 0);
      console.log('Crime Rate:', neighborhoodData.crime?.crimeRate);
    } else {
      console.log('Neighborhood API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('Neighborhood API Test: FAILED', error);
  }
}

// Test PropertyData API - Flood Risk
async function testFloodRisk() {
  console.log('\n--- Testing PropertyData Flood Risk API ---');
  try {
    console.log(`Fetching flood risk data for: ${testPostcode}`);
    const floodRiskData = await PropertyDataAPI.getFloodRisk(testPostcode);
    
    if (floodRiskData) {
      console.log('Flood Risk API Test: SUCCESS');
      console.log('Flood Risk:', floodRiskData.floodRisk);
      console.log('Risk Factors:', floodRiskData.riskFactors);
    } else {
      console.log('Flood Risk API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('Flood Risk API Test: FAILED', error);
  }
}

// Test PropertyData API - Property History
async function testPropertyHistory() {
  console.log('\n--- Testing PropertyData Property History API ---');
  try {
    console.log(`Fetching property history for: ${testPostcode}`);
    const historyData = await PropertyDataAPI.getPropertyHistory(testPostcode, '76');
    
    if (historyData) {
      console.log('Property History API Test: SUCCESS');
      console.log('Sales History Count:', historyData.salesHistory?.length || 0);
      console.log('Average Sold Price:', historyData.averageSoldPrice);
    } else {
      console.log('Property History API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('Property History API Test: FAILED', error);
  }
}

// Test PropertyData API - Council Tax
async function testCouncilTax() {
  console.log('\n--- Testing PropertyData Council Tax API ---');
  try {
    console.log(`Fetching council tax data for: ${testPostcode}`);
    const councilTaxData = await PropertyDataAPI.getCouncilTaxInfo(testPostcode);
    
    if (councilTaxData) {
      console.log('Council Tax API Test: SUCCESS');
      console.log('Council Tax Band:', councilTaxData.councilTaxBand);
      console.log('Annual Amount:', councilTaxData.annualAmount);
      console.log('Local Authority:', councilTaxData.localAuthority);
    } else {
      console.log('Council Tax API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('Council Tax API Test: FAILED', error);
  }
}

// Create or update a test property in the database
async function createTestProperty() {
  console.log('\n--- Creating Test Property ---');
  
  // Check if property already exists
  const { data: existingProperty } = await supabase
    .from('properties')
    .select('id')
    .eq('address', testAddress)
    .eq('postcode', testPostcode)
    .single();
  
  if (existingProperty) {
    console.log(`Test property already exists with ID: ${existingProperty.id}`);
    return existingProperty.id;
  }
  
  // Get a user ID to associate with the property
  const { data: user } = await supabase
    .from('auth.users')
    .select('id')
    .limit(1)
    .single();
  
  if (!user) {
    console.error('No user found in the database');
    return null;
  }
  
  // Create the property
  const { data: newProperty, error } = await supabase
    .from('properties')
    .insert({
      address: testAddress,
      postcode: testPostcode,
      property_type: 'flat',
      bedrooms: 2,
      bathrooms: 1,
      user_id: user.id,
      city: 'London',
      status: 'occupied'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating test property:', error);
    return null;
  }
  
  console.log(`Created test property with ID: ${newProperty.id}`);
  return newProperty.id;
}

// Run all tests
async function runTests() {
  console.log('Starting API tests...');
  
  // Test individual APIs
  await testEpcApi();
  await testPropertyValuation();
  await testRentalEstimate();
  await testNeighborhoodData();
  await testFloodRisk();
  await testPropertyHistory();
  await testCouncilTax();
  
  // Create test property and store enrichment data
  const propertyId = await createTestProperty();
  
  if (propertyId) {
    console.log(`\n--- Testing Full Enrichment Flow for Property ID: ${propertyId} ---`);
    
    // Import the enrichment service functions
    const { 
      fetchEnergyData,
      fetchPropertyValuation,
      fetchRentalData,
      fetchNeighborhoodData,
      fetchFloodRiskData,
      fetchPropertyHistory,
      fetchCouncilTaxData,
      getPropertyEnrichmentData
    } = require('../lib/propertyEnrichmentService');
    
    // Run all enrichment processes
    await Promise.all([
      fetchEnergyData(propertyId),
      fetchPropertyValuation(propertyId),
      fetchRentalData(propertyId),
      fetchNeighborhoodData(propertyId),
      fetchFloodRiskData(propertyId),
      fetchPropertyHistory(propertyId),
      fetchCouncilTaxData(propertyId)
    ]);
    
    // Get and display the stored enrichment data
    const enrichmentData = await getPropertyEnrichmentData(propertyId);
    console.log('\n--- Stored Enrichment Data ---');
    console.log(JSON.stringify(enrichmentData, null, 2));
  }
  
  console.log('\nAll tests completed!');
}

// Run the tests
runTests().catch(console.error);
