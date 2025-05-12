import { propertyDataRateLimiter } from './apiRateLimiter';

// PropertyData.co.uk API integration
export const PropertyDataAPI = {
  // Use the API key directly since we're having issues with environment variables
  API_KEY: 'BQQWGXRZHK',
  BASE_URL: 'https://api.propertydata.co.uk',
  
  // Format a postcode for API requests (remove spaces)
  formatPostcode(postcode: string): string {
    return postcode.replace(/\s+/g, '');
  },
  
  // Helper method for API calls
  async callApi(endpoint: string, params: Record<string, string>): Promise<any> {
    return propertyDataRateLimiter.execute(async () => {
      try {
      // Create a new object with the API key added
      const paramsWithKey = { ...params, key: this.API_KEY };
      
      // Convert to URL search params
      const queryParams = new URLSearchParams();
      Object.entries(paramsWithKey).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      
      const url = `${this.BASE_URL}/${endpoint}?${queryParams.toString()}`;
      console.log(`Calling PropertyData API: ${endpoint}`, params);
      console.log(`Full URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response body: ${errorText}`);
        throw new Error(`PropertyData API error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`PropertyData API response (${endpoint}):`, data);
      
      if (data.status === 'error') {
        throw new Error(`PropertyData API error: ${data.message || 'Unknown error'}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error calling PropertyData API (${endpoint}):`, error);
      throw error;
    }
    });
  },
  
  // Property Valuation
  async getValuation(propertyDetails: {
    postcode: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    constructionDate?: string;
  }): Promise<any> {
    const params: Record<string, string> = {
      postcode: this.formatPostcode(propertyDetails.postcode)
    };
    
    if (propertyDetails.propertyType) {
      params.property_type = propertyDetails.propertyType;
    }
    
    if (propertyDetails.bedrooms) {
      params.bedrooms = propertyDetails.bedrooms.toString();
    }
    
    if (propertyDetails.bathrooms) {
      params.bathrooms = propertyDetails.bathrooms.toString();
    }
    
    if (propertyDetails.squareFeet) {
      params.internal_area = propertyDetails.squareFeet.toString();
    }
    
    if (propertyDetails.constructionDate) {
      params.construction_date = propertyDetails.constructionDate;
    }
    
    try {
      const data = await this.callApi('valuation-sale', params);
      
      return {
        estimatedValue: data.result?.estimate,
        valueRange: {
          low: data.result?.lower_bound,
          high: data.result?.upper_bound,
        },
        confidence: data.result?.confidence,
        comparableProperties: data.result?.comparables || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getValuation:', error);
      return null;
    }
  },
  
  // Rental Market Analysis
  async getRentalEstimate(propertyDetails: {
    postcode: string;
    propertyType?: string;
    bedrooms?: number;
    constructionDate?: string;
    squareFeet?: number;
  }): Promise<any> {
    const params: Record<string, string> = {
      postcode: this.formatPostcode(propertyDetails.postcode)
    };
    
    if (propertyDetails.propertyType) {
      params.property_type = propertyDetails.propertyType;
    }
    
    if (propertyDetails.bedrooms) {
      params.bedrooms = propertyDetails.bedrooms.toString();
    }
    
    if (propertyDetails.constructionDate) {
      params.construction_date = propertyDetails.constructionDate;
    }
    
    try {
      const data = await this.callApi('valuation-rent', params);
      
      return {
        estimatedRent: data.result?.estimate,
        rentRange: {
          low: data.result?.lower_bound,
          high: data.result?.upper_bound,
        },
        confidence: data.result?.confidence,
        comparableProperties: data.result?.comparables || [],
        yieldEstimate: data.result?.yield,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getRentalEstimate:', error);
      return null;
    }
  },
  
  // Neighborhood Data
  async getNeighborhoodData(postcode: string): Promise<any> {
    try {
      const formattedPostcode = this.formatPostcode(postcode);
      
      // Demographics data
      const demographicsData = await this.callApi('demographics', { postcode: formattedPostcode });
      
      // Schools data
      const schoolsData = await this.callApi('schools', { postcode: formattedPostcode });
      
      // Crime data
      const crimeData = await this.callApi('crime', { postcode: formattedPostcode });
      
      return {
        demographics: {
          population: demographicsData.result?.population,
          householdIncome: demographicsData.result?.household_income,
          ageDistribution: demographicsData.result?.age_distribution,
          socialGrade: demographicsData.result?.social_grade
        },
        schools: schoolsData.result?.schools?.map((school: any) => ({
          name: school.name,
          type: school.type,
          rating: school.rating,
          distance: school.distance
        })) || [],
        crime: {
          crimeRate: crimeData.result?.crime_rate,
          nationalAverage: crimeData.result?.national_average,
          crimeTypes: crimeData.result?.crime_types
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getNeighborhoodData:', error);
      return null;
    }
  },
  
  // Flood Risk
  async getFloodRisk(postcode: string): Promise<any> {
    try {
      const formattedPostcode = this.formatPostcode(postcode);
      const data = await this.callApi('flood-risk', { postcode: formattedPostcode });
      
      return {
        floodRisk: data.result?.risk_level,
        riskFactors: data.result?.risk_factors,
        floodHistory: data.result?.flood_history || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getFloodRisk:', error);
      return null;
    }
  },
  
  // Property Sales History
  async getPropertyHistory(postcode: string, houseNumber?: string): Promise<any> {
    const params: Record<string, string> = {
      postcode: this.formatPostcode(postcode)
    };
    
    if (houseNumber) {
      params.house_number = houseNumber;
    }
    
    try {
      const data = await this.callApi('sold-prices', params);
      
      return {
        salesHistory: data.result?.transactions?.map((transaction: any) => ({
          date: transaction.date,
          price: transaction.price,
          propertyType: transaction.property_type,
          address: transaction.address
        })) || [],
        averageSoldPrice: data.result?.average_sold_price,
        priceChanges: data.result?.price_change,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getPropertyHistory:', error);
      return null;
    }
  },
  
  // Council Tax Information
  async getCouncilTaxInfo(postcode: string): Promise<any> {
    try {
      const formattedPostcode = this.formatPostcode(postcode);
      const data = await this.callApi('council-tax', { postcode: formattedPostcode });
      
      return {
        councilTaxBand: data.result?.band,
        annualAmount: data.result?.annual_amount,
        localAuthority: data.result?.local_authority,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getCouncilTaxInfo:', error);
      return null;
    }
  },
  
  // Freeholds Information
  async getFreeholds(postcode: string): Promise<any> {
    try {
      const formattedPostcode = this.formatPostcode(postcode);
      const data = await this.callApi('freeholds', { postcode: formattedPostcode });
      
      return {
        freeholds: data.result?.freeholds || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getFreeholds:', error);
      return null;
    }
  },
  
  // National HMO Register Check
  async checkHmoRegister(postcode: string, houseNumber?: string): Promise<any> {
    try {
      const params: Record<string, string> = {
        postcode: this.formatPostcode(postcode)
      };
      
      if (houseNumber) {
        params.house_number = houseNumber;
      }
      
      const data = await this.callApi('national-hmo-register', params);
      
      return {
        isRegistered: data.result?.is_registered || false,
        registrations: data.result?.registrations || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in checkHmoRegister:', error);
      return null;
    }
  },
  
  // Average Rents
  async getAverageRents(postcode: string, propertyType?: string, bedrooms?: number): Promise<any> {
    try {
      const params: Record<string, string> = {
        postcode: this.formatPostcode(postcode)
      };
      
      if (propertyType) {
        params.property_type = propertyType;
      }
      
      if (bedrooms) {
        params.bedrooms = bedrooms.toString();
      }
      
      const data = await this.callApi('rents', params);
      
      return {
        averageRent: data.result?.average_rent,
        rentRange: {
          low: data.result?.lower_bound,
          high: data.result?.upper_bound
        },
        rentPerSqFt: data.result?.rent_per_sqft,
        sampleSize: data.result?.sample_size,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getAverageRents:', error);
      return null;
    }
  },
  
  // Average HMO Rents
  async getAverageHmoRents(postcode: string, bedrooms?: number): Promise<any> {
    try {
      const params: Record<string, string> = {
        postcode: this.formatPostcode(postcode)
      };
      
      if (bedrooms) {
        params.bedrooms = bedrooms.toString();
      }
      
      const data = await this.callApi('rents-hmo', params);
      
      return {
        averageRentPerRoom: data.result?.average_rent_per_room,
        rentRangePerRoom: {
          low: data.result?.lower_bound,
          high: data.result?.upper_bound
        },
        sampleSize: data.result?.sample_size,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getAverageHmoRents:', error);
      return null;
    }
  },
  
  // Last Sold (Property Sales History) - Enhanced version of getPropertyHistory
  async getLastSold(postcode: string, houseNumber?: string): Promise<any> {
    const params: Record<string, string> = {
      postcode: this.formatPostcode(postcode)
    };
    
    if (houseNumber) {
      params.house_number = houseNumber;
    }
    
    try {
      const data = await this.callApi('sold-prices', params);
      
      // Get the most recent transaction if available
      const mostRecentTransaction = data.result?.transactions && data.result.transactions.length > 0 ?
        data.result.transactions[0] : null;
      
      return {
        lastSoldDate: mostRecentTransaction?.date,
        lastSoldPrice: mostRecentTransaction?.price,
        priceChangeSinceLastSold: data.result?.price_change,
        salesHistory: data.result?.transactions?.map((transaction: any) => ({
          date: transaction.date,
          price: transaction.price,
          propertyType: transaction.property_type,
          address: transaction.address
        })) || [],
        averageSoldPrice: data.result?.average_sold_price,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getLastSold:', error);
      return null;
    }
  }
};
