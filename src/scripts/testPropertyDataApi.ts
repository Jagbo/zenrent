// Simple test script for the PropertyData API
import { PropertyDataAPI } from '../lib/propertyDataApi';

// Test property details
const testPostcode = "E17 7GA";

async function testPropertyDataApi() {
  console.log('--- Testing PropertyData API ---');
  
  try {
    console.log(`\nTesting Valuation API for postcode: ${testPostcode}`);
    const valuationData = await PropertyDataAPI.getValuation({
      postcode: testPostcode,
      propertyType: 'flat',
      bedrooms: 2
    });
    
    if (valuationData) {
      console.log('Valuation API Test: SUCCESS');
      console.log('Estimated Value:', valuationData.estimatedValue);
      console.log('Value Range:', valuationData.valueRange);
    }
  } catch (error) {
    console.error('Valuation API Test: FAILED', error);
  }
  
  try {
    console.log(`\nTesting Rental Estimate API for postcode: ${testPostcode}`);
    const rentalData = await PropertyDataAPI.getRentalEstimate({
      postcode: testPostcode,
      propertyType: 'flat',
      bedrooms: 2
    });
    
    if (rentalData) {
      console.log('Rental API Test: SUCCESS');
      console.log('Estimated Rent:', rentalData.estimatedRent);
      console.log('Rent Range:', rentalData.rentRange);
    }
  } catch (error) {
    console.error('Rental API Test: FAILED', error);
  }
}

// Run the test
testPropertyDataApi().catch(console.error);
