/**
 * Simple test script for PropertyData API
 * 
 * This script directly tests the PropertyData API neighborhood endpoints
 * which don't require the internal_area parameter.
 */

import { PropertyDataAPI } from '../lib/propertyDataApi';

// Test property details
const testPostcode = "E17 7GA";

// Test the PropertyData API neighborhood data
async function testPropertyDataNeighborhood() {
  console.log('\n--- Testing PropertyData API (Neighborhood) ---');
  
  try {
    console.log(`Getting neighborhood data for: ${testPostcode}`);
    
    const neighborhoodData = await PropertyDataAPI.getNeighborhoodData(testPostcode);
    
    if (neighborhoodData) {
      console.log('PropertyData API (Neighborhood) SUCCESS! Data received:');
      console.log(`Population: ${neighborhoodData.demographics?.population?.toLocaleString() || 'N/A'}`);
      console.log(`Schools: ${neighborhoodData.schools?.length || 0} nearby`);
      console.log(`Crime Rate: ${neighborhoodData.crime?.crimeRate || 'N/A'}`);
      return true;
    } else {
      console.log('No neighborhood data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing PropertyData API (Neighborhood):', error);
    return false;
  }
}

// Test the PropertyData API flood risk
async function testPropertyDataFloodRisk() {
  console.log('\n--- Testing PropertyData API (Flood Risk) ---');
  
  try {
    console.log(`Getting flood risk data for: ${testPostcode}`);
    
    const floodRiskData = await PropertyDataAPI.getFloodRisk(testPostcode);
    
    if (floodRiskData) {
      console.log('PropertyData API (Flood Risk) SUCCESS! Data received:');
      console.log(`Flood Risk Level: ${floodRiskData.floodRisk || 'N/A'}`);
      console.log(`Risk Factors: ${JSON.stringify(floodRiskData.riskFactors || {})}`);
      return true;
    } else {
      console.log('No flood risk data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing PropertyData API (Flood Risk):', error);
    return false;
  }
}

// Test the PropertyData API council tax
async function testPropertyDataCouncilTax() {
  console.log('\n--- Testing PropertyData API (Council Tax) ---');
  
  try {
    console.log(`Getting council tax data for: ${testPostcode}`);
    
    const councilTaxData = await PropertyDataAPI.getCouncilTaxInfo(testPostcode);
    
    if (councilTaxData) {
      console.log('PropertyData API (Council Tax) SUCCESS! Data received:');
      console.log(`Council Tax Band: ${councilTaxData.councilTaxBand || 'N/A'}`);
      console.log(`Annual Amount: £${councilTaxData.annualAmount?.toLocaleString() || 'N/A'}`);
      console.log(`Local Authority: ${councilTaxData.localAuthority || 'N/A'}`);
      return true;
    } else {
      console.log('No council tax data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing PropertyData API (Council Tax):', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting PropertyData API integration tests...');
  console.log(`Test postcode: ${testPostcode}`);
  
  // Test PropertyData APIs
  const neighborhoodSuccess = await testPropertyDataNeighborhood();
  const floodRiskSuccess = await testPropertyDataFloodRisk();
  const councilTaxSuccess = await testPropertyDataCouncilTax();
  
  // Summary
  console.log('\n--- Test Summary ---');
  console.log(`PropertyData API (Neighborhood): ${neighborhoodSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Flood Risk): ${floodRiskSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Council Tax): ${councilTaxSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  const overallSuccess = neighborhoodSuccess && floodRiskSuccess && councilTaxSuccess;
  console.log(`\nOverall Test Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return overallSuccess;
}

// Run the tests
runTests().catch(console.error);
