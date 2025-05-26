const { getPropertyEnergyDataClient } = require('../src/services/propertyEnrichmentService.ts');

async function testEnergyService() {
  try {
    console.log('🔍 Testing energy data service...');
    const data = await getPropertyEnergyDataClient('d2a69e47-b372-4b98-bb1e-717315e4001c');
    console.log('✅ Energy data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEnergyService(); 