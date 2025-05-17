# ZenRent API Integrations

This directory contains API integrations for various property data services.

## PropertyData API

The PropertyData API provides comprehensive property data for the UK market. The following endpoints are implemented:

### Core Endpoints

- **Energy Efficiency** (`energyEfficiencyApi.ts`)
  - Retrieves EPC ratings and energy efficiency data for properties
  - Handles flat/apartment number matching

- **Neighborhood Data** (`propertyDataApi.ts`)
  - Demographics
  - Schools
  - Crime rates

- **Flood Risk** (`propertyDataApi.ts`)
  - Flood risk assessment for properties

- **Council Tax** (`propertyDataApi.ts`)
  - Council tax bands and rates

### Additional Endpoints

- **Freeholds** (`propertyDataApi.ts`)
  - Information about freehold titles in an area

- **HMO Register** (`propertyDataApi.ts`)
  - Check if a property is registered as an HMO (House in Multiple Occupation)

- **Average Rents** (`propertyDataApi.ts`)
  - Average rental prices for properties based on type and bedrooms

- **Average HMO Rents** (`propertyDataApi.ts`)
  - Average rental prices for HMO rooms

- **Last Sold** (`propertyDataApi.ts`)
  - Property sales history and price changes

## Testing

The API integrations can be tested using the following scripts:

- `src/scripts/testAllApis.ts` - Tests all API integrations
- `src/scripts/testEpcApiNew.ts` - Tests only the EPC API
- `src/scripts/testPropertyDataApiSimple.ts` - Tests basic PropertyData endpoints
- `src/scripts/testAdditionalApis.ts` - Tests the additional PropertyData endpoints

## Rate Limiting

All API calls are rate-limited to prevent hitting API usage limits. The rate limiter is implemented in `apiRateLimiter.ts`.

## Usage

```typescript
// Example: Get energy efficiency data
import { EnergyEfficiencyAPI } from '../lib/energyEfficiencyApi';

const energyData = await EnergyEfficiencyAPI.getEnergyRating({
  address: "Flat 53, Fairlie house, 76 brunner road",
  postcode: "E17 7GA"
});

// Example: Get neighborhood data
import { PropertyDataAPI } from '../lib/propertyDataApi';

const neighborhoodData = await PropertyDataAPI.getNeighborhoodData("E17 7GA");

// Example: Check HMO register
const hmoData = await PropertyDataAPI.checkHmoRegister("E17 7GA", "76");
```

## Environment Variables

The API integrations use the following environment variables:

- `PROPERTY_DATA_API_KEY` - API key for PropertyData services

These should be defined in your `.env` or `.env.local` file.
