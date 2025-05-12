/**
 * Test script for additional PropertyData API endpoints
 * 
 * This script tests the newly added PropertyData API endpoints:
 * 1. Freeholds
 * 2. HMO Register Check
 * 3. Average Rents
 * 4. Average HMO Rents
 * 5. Last Sold
 */

import { PropertyDataAPI } from '../lib/propertyDataApi';

// Test property details
const testAddress = "Flat 53, Fairlie house, 76 brunner road";
const testPostcode = "E17 7GA";
const testPropertyType = "flat";
const testBedrooms = 2;
const houseNumber = "76"; // For endpoints that need a house number

// Test the Freeholds API
async function testFreeholds() {
  console.log('\n--- Testing PropertyData API (Freeholds) ---');
  
  try {
    console.log(`Getting freeholds data for: ${testPostcode}`);
    
    const freeholdsData = await PropertyDataAPI.getFreeholds(testPostcode);
    
    if (freeholdsData) {
      console.log('PropertyData API (Freeholds) SUCCESS! Data received:');
      console.log(`Number of freeholds: ${freeholdsData.freeholds?.length || 0}`);
      
      if (freeholdsData.freeholds && freeholdsData.freeholds.length > 0) {
        console.log('\nSample freeholds:');
        freeholdsData.freeholds.slice(0, 3).forEach((freehold: any, index: number) => {
          console.log(`${index + 1}. Title: ${freehold.title_number || 'N/A'}`);
          console.log(`   Address: ${freehold.address || 'N/A'}`);
          console.log(`   Proprietor: ${freehold.proprietor_name || 'N/A'}`);
        });
        
        if (freeholdsData.freeholds.length > 3) {
          console.log(`... and ${freeholdsData.freeholds.length - 3} more freeholds`);
        }
      }
      
      return true;
    } else {
      console.log('No freeholds data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing Freeholds API:', error);
    return false;
  }
}

// Test the HMO Register API
async function testHmoRegister() {
  console.log('\n--- Testing PropertyData API (HMO Register) ---');
  
  try {
    console.log(`Checking HMO register for: ${testPostcode}, ${houseNumber}`);
    
    const hmoData = await PropertyDataAPI.checkHmoRegister(testPostcode, houseNumber);
    
    if (hmoData) {
      console.log('PropertyData API (HMO Register) SUCCESS! Data received:');
      console.log(`Is registered as HMO: ${hmoData.isRegistered ? 'Yes' : 'No'}`);
      console.log(`Number of registrations: ${hmoData.registrations?.length || 0}`);
      
      if (hmoData.registrations && hmoData.registrations.length > 0) {
        console.log('\nRegistration details:');
        hmoData.registrations.slice(0, 3).forEach((reg: any, index: number) => {
          console.log(`${index + 1}. Authority: ${reg.authority || 'N/A'}`);
          console.log(`   License number: ${reg.license_number || 'N/A'}`);
          console.log(`   Valid until: ${reg.valid_until || 'N/A'}`);
        });
      }
      
      return true;
    } else {
      console.log('No HMO register data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing HMO Register API:', error);
    return false;
  }
}

// Test the Average Rents API
async function testAverageRents() {
  console.log('\n--- Testing PropertyData API (Average Rents) ---');
  
  try {
    console.log(`Getting average rents for: ${testPostcode}, ${testPropertyType}, ${testBedrooms} bed`);
    
    const rentsData = await PropertyDataAPI.getAverageRents(testPostcode, testPropertyType, testBedrooms);
    
    if (rentsData) {
      console.log('PropertyData API (Average Rents) SUCCESS! Data received:');
      console.log(`Average rent: £${rentsData.averageRent?.toLocaleString() || 'N/A'} per month`);
      console.log(`Rent range: £${rentsData.rentRange?.low?.toLocaleString() || 'N/A'} - £${rentsData.rentRange?.high?.toLocaleString() || 'N/A'}`);
      console.log(`Rent per sq ft: £${rentsData.rentPerSqFt || 'N/A'}`);
      console.log(`Sample size: ${rentsData.sampleSize || 'N/A'}`);
      return true;
    } else {
      console.log('No average rents data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing Average Rents API:', error);
    return false;
  }
}

// Test the Average HMO Rents API
async function testAverageHmoRents() {
  console.log('\n--- Testing PropertyData API (Average HMO Rents) ---');
  
  try {
    console.log(`Getting average HMO rents for: ${testPostcode}, ${testBedrooms} bed`);
    
    const hmoRentsData = await PropertyDataAPI.getAverageHmoRents(testPostcode, testBedrooms);
    
    if (hmoRentsData) {
      console.log('PropertyData API (Average HMO Rents) SUCCESS! Data received:');
      console.log(`Average rent per room: £${hmoRentsData.averageRentPerRoom?.toLocaleString() || 'N/A'} per month`);
      console.log(`Rent range per room: £${hmoRentsData.rentRangePerRoom?.low?.toLocaleString() || 'N/A'} - £${hmoRentsData.rentRangePerRoom?.high?.toLocaleString() || 'N/A'}`);
      console.log(`Sample size: ${hmoRentsData.sampleSize || 'N/A'}`);
      return true;
    } else {
      console.log('No average HMO rents data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing Average HMO Rents API:', error);
    return false;
  }
}

// Test the Last Sold API
async function testLastSold() {
  console.log('\n--- Testing PropertyData API (Last Sold) ---');
  
  try {
    console.log(`Getting last sold data for: ${testPostcode}, ${houseNumber}`);
    
    const lastSoldData = await PropertyDataAPI.getLastSold(testPostcode, houseNumber);
    
    if (lastSoldData) {
      console.log('PropertyData API (Last Sold) SUCCESS! Data received:');
      console.log(`Last sold date: ${lastSoldData.lastSoldDate || 'N/A'}`);
      console.log(`Last sold price: £${lastSoldData.lastSoldPrice?.toLocaleString() || 'N/A'}`);
      console.log(`Price change since last sold: ${lastSoldData.priceChangeSinceLastSold || 'N/A'}%`);
      console.log(`Average sold price in area: £${lastSoldData.averageSoldPrice?.toLocaleString() || 'N/A'}`);
      
      if (lastSoldData.salesHistory && lastSoldData.salesHistory.length > 0) {
        console.log('\nSales history:');
        lastSoldData.salesHistory.slice(0, 3).forEach((sale: any, index: number) => {
          console.log(`${index + 1}. Date: ${sale.date || 'N/A'}`);
          console.log(`   Price: £${sale.price?.toLocaleString() || 'N/A'}`);
          console.log(`   Property type: ${sale.propertyType || 'N/A'}`);
        });
        
        if (lastSoldData.salesHistory.length > 3) {
          console.log(`... and ${lastSoldData.salesHistory.length - 3} more sales`);
        }
      }
      
      return true;
    } else {
      console.log('No last sold data found for this property.');
      return false;
    }
  } catch (error) {
    console.error('Error testing Last Sold API:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting additional PropertyData API tests...');
  console.log(`Test property: ${testAddress}, ${testPostcode}`);
  
  // Test all new APIs
  const freeholdsSuccess = await testFreeholds();
  const hmoRegisterSuccess = await testHmoRegister();
  const averageRentsSuccess = await testAverageRents();
  const averageHmoRentsSuccess = await testAverageHmoRents();
  const lastSoldSuccess = await testLastSold();
  
  // Summary
  console.log('\n--- Test Summary ---');
  console.log(`PropertyData API (Freeholds): ${freeholdsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (HMO Register): ${hmoRegisterSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Average Rents): ${averageRentsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Average HMO Rents): ${averageHmoRentsSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`PropertyData API (Last Sold): ${lastSoldSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  const overallSuccess = freeholdsSuccess && hmoRegisterSuccess && averageRentsSuccess && 
                         averageHmoRentsSuccess && lastSoldSuccess;
  console.log(`\nOverall Test Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return overallSuccess;
}

// Run the tests
runTests().catch(console.error);
