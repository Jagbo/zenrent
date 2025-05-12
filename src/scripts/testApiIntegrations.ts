/**
 * Test script for API integrations
 * 
 * This script directly tests the EPC API and PropertyData API integrations
 * with a real address to verify they're working correctly.
 */

import { EnergyEfficiencyAPI } from '../lib/energyEfficiencyApi';
import { PropertyDataAPI } from '../lib/propertyDataApi';

// Test property details
const testAddress = "Flat 53, Fairlie house, 76 brunner road";
const testPostcode = "E17 7GA";
const testPropertyType = "flat";
const testBedrooms = 2;
const testBathrooms = 1;
const testConstructionDate = "1960-1969"; // Adding construction date for PropertyData API
const testSquareFeet = 650; // Adding square footage for PropertyData API

// Test the EPC API
async function testEpcApi() {
  console.log('\n--- Testing EPC API ---');
  
  try {
    console.log(`Searching for EPC data for: ${testAddress}, ${testPostcode}`);
    
    const energyData = await EnergyEfficiencyAPI.getEnergyRating({
      address: testAddress,
      postcode: testPostcode
    });
    
    if (energyData) {
      console.log('EPC API SUCCESS! Data received:');
      console.log(`EPC Rating: ${energyData.epcRating}`);
      console.log(`Energy Score: ${energyData.energyScore}`);
      console.log(`CO2 Emissions: ${energyData.co2Emissions}`);
      console.log(`Valid Until: ${energyData.validUntil}`);
      return true;
    } else {
      console.log('No EPC data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing EPC API:', error);
    return false;
  }
}

// Test the PropertyData API valuation
async function testPropertyDataValuation() {
  console.log('\n--- Testing PropertyData API (Valuation) ---');
  
  try {
    console.log(`Getting valuation for: ${testPostcode}, ${testPropertyType}, ${testBedrooms} bed`);
    
    const valuationData = await PropertyDataAPI.getValuation({
      postcode: testPostcode,
      propertyType: testPropertyType,
      bedrooms: testBedrooms,
      bathrooms: testBathrooms,
      constructionDate: testConstructionDate,
      squareFeet: testSquareFeet
    });
    
    if (valuationData) {
      console.log('PropertyData API (Valuation) SUCCESS! Data received:');
      console.log(`Estimated Value: £${valuationData.estimatedValue?.toLocaleString() || 'N/A'}`);
      console.log(`Value Range: £${valuationData.valueRange?.low?.toLocaleString() || 'N/A'} - £${valuationData.valueRange?.high?.toLocaleString() || 'N/A'}`);
      console.log(`Confidence: ${valuationData.confidence || 'N/A'}`);
      return true;
    } else {
      console.log('No valuation data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing PropertyData API (Valuation):', error);
    return false;
  }
}

// Test the PropertyData API rental estimate
async function testPropertyDataRental() {
  console.log('\n--- Testing PropertyData API (Rental) ---');
  
  try {
    console.log(`Getting rental estimate for: ${testPostcode}, ${testPropertyType}, ${testBedrooms} bed`);
    
    const rentalData = await PropertyDataAPI.getRentalEstimate({
      postcode: testPostcode,
      propertyType: testPropertyType,
      bedrooms: testBedrooms,
      constructionDate: testConstructionDate,
      squareFeet: testSquareFeet // Add square footage to rental estimate
    });
    
    if (rentalData) {
      console.log('PropertyData API (Rental) SUCCESS! Data received:');
      console.log(`Estimated Rent: £${rentalData.estimatedRent?.toLocaleString() || 'N/A'} per month`);
      console.log(`Rent Range: £${rentalData.rentRange?.low?.toLocaleString() || 'N/A'} - £${rentalData.rentRange?.high?.toLocaleString() || 'N/A'}`);
      console.log(`Yield Estimate: ${rentalData.yieldEstimate || 'N/A'}%`);
      return true;
    } else {
      console.log('No rental data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing PropertyData API (Rental):', error);
    return false;
  }
}

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

// Run all tests
async function runTests() {
  console.log('Starting API integration tests...');
  console.log(`Test property: ${testAddress}, ${testPostcode}`);
  
  // Test EPC API
  const epcSuccess = await testEpcApi();
  
  // Test PropertyData APIs
  const valuationSuccess = await testPropertyDataValuation();
  const rentalSuccess = await testPropertyDataRental();
  const neighborhoodSuccess = await testPropertyDataNeighborhood();
  
  // Summary
  console.log('\n--- Test Summary ---');
  console.log(`EPC API: ${epcSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Valuation): ${valuationSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Rental): ${rentalSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Neighborhood): ${neighborhoodSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  const overallSuccess = epcSuccess && valuationSuccess && rentalSuccess && neighborhoodSuccess;
  console.log(`\nOverall Test Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return overallSuccess;
}

// Run the tests
runTests().catch(console.error);
