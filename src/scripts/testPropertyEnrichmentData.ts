/**
 * Test script for saving PropertyData API results to a local JSON file
 * 
 * This script:
 * 1. Fetches data from the PropertyData API endpoints
 * 2. Saves the data to a local JSON file for later use
 */

import fs from 'fs';
import path from 'path';
import { EnergyEfficiencyAPI } from '../lib/energyEfficiencyApi';
import { PropertyDataAPI } from '../lib/propertyDataApi';

// Test property details
const testAddress = "Flat 53, Fairlie house, 76 brunner road";
const testPostcode = "E17 7GA";
const testPropertyType = "flat";
const testBedrooms = 2;
const testBathrooms = 1;
const houseNumber = "76"; // For endpoints that need a house number

// Function to save data to a local JSON file
async function saveToFile(dataType: string, data: any) {
  console.log(`Saving ${dataType} data to file...`);
  
  try {
    // Create the data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save the data to a JSON file
    const filePath = path.join(dataDir, `${dataType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`Successfully saved ${dataType} data to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error saving ${dataType} data:`, error);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('Starting property enrichment data tests...');
  
  try {
    // Mock EPC data for testing
    const epcData = {
      epcRating: "B",
      energyScore: 85,
      potentialRating: "A",
      potentialScore: 92,
      estimatedEnergyCost: 120,
      heatingCost: 450,
      hotWaterCost: 180,
      totalEnergyCost: 750,
      potentialSaving: 250,
      co2Emissions: 2.5,
      validUntil: "2032-08-02",
      recommendations: [
        {
          improvement: "Install solar panels",
          savingEstimate: "£250-£500",
          impact: "Medium"
        },
        {
          improvement: "Upgrade to LED lighting",
          savingEstimate: "£50-£100",
          impact: "Low"
        }
      ]
    };
    
    // Save EPC data
    const epcSuccess = await saveToFile('energy_efficiency', epcData);
    
    // Fetch and save neighborhood data
    const neighborhoodData = await PropertyDataAPI.getNeighborhoodData(testPostcode);
    const neighborhoodSuccess = await saveToFile('neighborhood', neighborhoodData);
    
    // Fetch and save flood risk data
    const floodRiskData = await PropertyDataAPI.getFloodRisk(testPostcode);
    const floodRiskSuccess = await saveToFile('flood_risk', floodRiskData);
    
    // Fetch and save council tax data
    const councilTaxData = await PropertyDataAPI.getCouncilTaxInfo(testPostcode);
    const councilTaxSuccess = await saveToFile('council_tax', councilTaxData);
    
    // Fetch and save freeholds data
    const freeholdsData = await PropertyDataAPI.getFreeholds(testPostcode);
    const freeholdsSuccess = await saveToFile('freeholds', freeholdsData);
    
    // Fetch and save HMO register data
    const hmoData = await PropertyDataAPI.checkHmoRegister(testPostcode, houseNumber);
    const hmoRegisterSuccess = await saveToFile('hmo_register', hmoData);
    
    // Fetch and save average rents data
    const rentsData = await PropertyDataAPI.getAverageRents(testPostcode, testPropertyType, testBedrooms);
    const averageRentsSuccess = await saveToFile('average_rents', rentsData);
    
    // Fetch and save average HMO rents data
    const hmoRentsData = await PropertyDataAPI.getAverageHmoRents(testPostcode, testBedrooms);
    const averageHmoRentsSuccess = await saveToFile('average_hmo_rents', hmoRentsData);
    
    // Fetch and save last sold data
    const lastSoldData = await PropertyDataAPI.getLastSold(testPostcode, houseNumber);
    const lastSoldSuccess = await saveToFile('last_sold', lastSoldData);
    
    // Create a combined data object with all property enrichment data
    const combinedData = {
      property: {
        address: testAddress,
        postcode: testPostcode,
        property_type: testPropertyType,
        bedrooms: testBedrooms,
        bathrooms: testBathrooms
      },
      energy_efficiency: epcData,
      neighborhood: neighborhoodData,
      flood_risk: floodRiskData,
      council_tax: councilTaxData,
      freeholds: freeholdsData,
      hmo_register: hmoData,
      average_rents: rentsData,
      average_hmo_rents: hmoRentsData,
      last_sold: lastSoldData,
      timestamp: new Date().toISOString()
    };
    
    // Save the combined data
    const combinedSuccess = await saveToFile('property_enrichment_combined', combinedData);
    
    // Summary
    console.log('\n--- Property Enrichment Data Test Summary ---');
    console.log(`Energy Efficiency: ${epcSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Neighborhood: ${neighborhoodSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Flood Risk: ${floodRiskSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Council Tax: ${councilTaxSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Freeholds: ${freeholdsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`HMO Register: ${hmoRegisterSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Average Rents: ${averageRentsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Average HMO Rents: ${averageHmoRentsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Last Sold: ${lastSoldSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Combined Data: ${combinedSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    const overallSuccess = epcSuccess && neighborhoodSuccess && floodRiskSuccess && 
                           councilTaxSuccess && freeholdsSuccess && hmoRegisterSuccess && 
                           averageRentsSuccess && averageHmoRentsSuccess && lastSoldSuccess &&
                           combinedSuccess;
    
    console.log(`\nOverall Test Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return overallSuccess;
  } catch (error) {
    console.error('Error running property enrichment data tests:', error);
    return false;
  }
}

// Run the tests
runTests().catch(console.error);
