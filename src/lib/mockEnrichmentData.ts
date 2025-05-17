// Mock data for property enrichment when APIs are unavailable
export const mockEnrichmentData = {
  // Mock EPC data
  getEnergyData: (propertyId: string) => ({
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
    validUntil: "2030-05-12",
    recommendations: [
      {
        improvement: "Insulate hot water cylinder",
        savingEstimate: "£25-£35",
        impact: "Medium"
      },
      {
        improvement: "Install solar water heating",
        savingEstimate: "£60-£70",
        impact: "Medium"
      },
      {
        improvement: "Install solar photovoltaic panels",
        savingEstimate: "£210-£305",
        impact: "High"
      }
    ]
  }),
  
  // Mock property valuation data
  getValuationData: (propertyId: string) => ({
    estimatedValue: 325000,
    valueRange: {
      low: 310000,
      high: 340000,
    },
    confidence: "high",
    comparableProperties: [
      {
        address: "Flat 42, Fairlie House, Brunner Road",
        soldDate: "2024-01-15",
        soldPrice: 318000
      },
      {
        address: "Flat 27, Fairlie House, Brunner Road",
        soldDate: "2023-11-03",
        soldPrice: 322000
      }
    ],
    lastUpdated: new Date().toISOString()
  }),
  
  // Mock rental market data
  getRentalData: (propertyId: string) => ({
    estimatedRent: 1650,
    rentRange: {
      low: 1550,
      high: 1750,
    },
    confidence: "high",
    comparableProperties: [
      {
        address: "Flat 38, Fairlie House, Brunner Road",
        listedDate: "2024-03-10",
        rentAmount: 1600
      },
      {
        address: "Flat 15, Fairlie House, Brunner Road",
        listedDate: "2024-02-22",
        rentAmount: 1675
      }
    ],
    yieldEstimate: 6.1,
    lastUpdated: new Date().toISOString()
  }),
  
  // Mock neighborhood data
  getNeighborhoodData: (propertyId: string) => ({
    demographics: {
      population: 15250,
      householdIncome: 42500,
      ageDistribution: {
        under18: 22,
        age18to35: 35,
        age36to65: 32,
        over65: 11
      },
      socialGrade: {
        ab: 28,
        c1: 32,
        c2: 22,
        de: 18
      }
    },
    schools: [
      {
        name: "Walthamstow Primary School",
        type: "Primary",
        rating: "Good",
        distance: 0.4
      },
      {
        name: "East London Academy",
        type: "Secondary",
        rating: "Outstanding",
        distance: 0.8
      },
      {
        name: "St Mary's Catholic School",
        type: "Primary",
        rating: "Good",
        distance: 0.6
      }
    ],
    crime: {
      crimeRate: 85,
      nationalAverage: 100,
      crimeTypes: {
        burglary: "Below average",
        violentCrime: "Average",
        antiSocialBehavior: "Below average"
      }
    },
    lastUpdated: new Date().toISOString()
  }),
  
  // Mock flood risk data
  getFloodRiskData: (propertyId: string) => ({
    floodRisk: "Very Low",
    riskFactors: {
      riverFlood: "Very Low",
      surfaceWater: "Low",
      groundwater: "Very Low"
    },
    floodHistory: [],
    lastUpdated: new Date().toISOString()
  }),
  
  // Mock property history data
  getPropertyHistoryData: (propertyId: string) => ({
    salesHistory: [
      {
        date: "2020-06-12",
        price: 295000,
        propertyType: "Flat",
        address: "Flat 53, Fairlie House, 76 Brunner Road"
      },
      {
        date: "2015-03-24",
        price: 245000,
        propertyType: "Flat",
        address: "Flat 53, Fairlie House, 76 Brunner Road"
      }
    ],
    averageSoldPrice: 270000,
    priceChanges: {
      oneYear: 8.5,
      threeYear: 15.2,
      fiveYear: 22.4
    },
    lastUpdated: new Date().toISOString()
  }),
  
  // Mock council tax data
  getCouncilTaxData: (propertyId: string) => ({
    councilTaxBand: "D",
    annualAmount: 1850,
    localAuthority: "Waltham Forest Council",
    lastUpdated: new Date().toISOString()
  })
};
