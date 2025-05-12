// Simple test script for the EPC API
import { EnergyEfficiencyAPI } from '../lib/energyEfficiencyApi';

// Set API key directly for testing
process.env.EPC_API_KEY = '5d0d1275a29d4a8d57d30f104cbabeb803d1b96b';

// Test property details
const testAddress = "Flat 53, Fairlie house, 76 brunner road";
const testPostcode = "E17 7GA";

async function testEpcApi() {
  console.log('--- Testing EPC API ---');
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
      console.log('\nFull data:', JSON.stringify(energyData, null, 2));
    } else {
      console.log('EPC API Test: NO DATA FOUND');
    }
  } catch (error) {
    console.error('EPC API Test: FAILED', error);
  }
}

// Run the test
testEpcApi().catch(console.error);
