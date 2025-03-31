import { supabase } from './supabase';

export interface IProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  postcode?: string;
  property_type: string;
  status?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  rentAmount?: number;
  description?: string;
  amenities?: string[];
  yearBuilt?: number;
  parkingSpots?: number;
  units?: number;
  occupied_units?: number;
  user_id: string;
  image?: string;
  photo_url?: string;
  property_code?: string;
  has_garden?: boolean;
  has_parking?: boolean;
  metadata?: {
    amenities?: string[];
    year_built?: number;
    square_footage?: number;
    [key: string]: any;
  };
}

export interface ITenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  about?: string;
  rent_amount?: number;
  property_address?: string;
  property_id?: string;
  property_code?: string;
}

export interface ILease {
  id: string;
  tenant_id: string;
  property_uuid: string;
  unit_id?: string;
  rent_amount: number;
  lease_start: string;
  lease_end: string;
  status: string;
}

export interface IPropertyWithTenants extends IProperty {
  tenants: ITenant[];
}

// Development mode test user ID
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// Fetch all properties for a specific user
export const getProperties = async (userId?: string): Promise<IProperty[]> => {
  try {
    // In development mode, use the test user ID if no user ID is provided
    const effectiveUserId = process.env.NODE_ENV === 'development' 
      ? TEST_USER_ID 
      : userId;
    
    if (!effectiveUserId) {
      console.error('No user ID provided and not in development mode');
      return [];
    }

    console.log('Fetching properties for user:', effectiveUserId);
    
    // Attempt to fetch from the database
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', effectiveUserId);
    
    if (error) {
      console.error('Error fetching properties from Supabase:', error);
      
      // Only use fallback data in development mode when there's an actual error
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback property data for development due to error');
        return getDevelopmentFallbackProperties(effectiveUserId);
      }
      
      throw error;
    }
    
    console.log('Properties fetched from Supabase:', data?.length || 0);
    
    // If we have data from the database, return it
    if (data && data.length > 0) {
      if (data[0]) {
        console.log('First property from DB:', {
          id: data[0].id,
          name: data[0].address,
          property_code: data[0].property_code
        });
      }
      return data;
    }
    
    // If no data was found in the database, log a warning
    console.warn('No properties found in the database for user:', effectiveUserId);
    
    // Only use fallback data in development mode when no properties are found
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback property data for development due to empty result');
      return getDevelopmentFallbackProperties(effectiveUserId);
    }
    
    // In production, return empty array if no properties found
    return [];
    
  } catch (error) {
    console.error('Error in getProperties:', error);
    
    // Only use fallback data in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback property data for development due to exception');
      return getDevelopmentFallbackProperties(TEST_USER_ID);
    }
    
    return [];
  }
};

// Helper function to get fallback properties for development
const getDevelopmentFallbackProperties = (userId: string): IProperty[] => {
  return [
    {
      id: '7a2e1487-f17b-4ceb-b6d1-56934589025b',
      name: '8 Victoria Gardens',
      address: '8 Victoria Gardens',
      city: 'Manchester',
      property_type: 'flat',
      status: 'active',
      user_id: userId,
      property_code: 'prop_8_victoria_gardens'
    },
    {
      id: 'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
      name: '15 Crescent Road',
      address: '15 Crescent Road',
      city: 'London',
      property_type: 'flat',
      status: 'active',
      user_id: userId,
      property_code: 'prop_15_crescent_road'
    },
    {
      id: 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
      name: '42 Harley Street',
      address: '42 Harley Street',
      city: 'London',
      property_type: 'house',
      status: 'active',
      user_id: userId,
      property_code: 'prop_42_harley_street'
    }
  ];
};

// Fetch all properties direct (debug)
export const getAllProperties = async (): Promise<IProperty[]> => {
  try {
    console.log('DEBUG: Fetching ALL properties');
    const { data, error } = await supabase
      .from('properties')
      .select('*');
    
    if (error) {
      console.error('Error fetching all properties:', error);
      throw error;
    }
    
    console.log('All properties fetched:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Property IDs:', data.map(p => p.id));
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching all properties:', error);
    return [];
  }
};

// Fetch a single property by ID
export const getPropertyById = async (propertyId: string): Promise<IProperty | null> => {
  try {
    console.log('Fetching property by ID:', propertyId);
    
    // First, try to get all properties to check if the database is accessible
    const allProperties = await getAllProperties();
    console.log(`Total properties in DB: ${allProperties.length}`);
    
    // Try direct ID match
    const matchingProperty = allProperties.find(p => p.id === propertyId);
    if (matchingProperty) {
      console.log('Found property by direct ID match:', matchingProperty.id);
      return matchingProperty;
    }
    
    // Try property code match
    const matchingByCode = allProperties.find(p => p.property_code === propertyId);
    if (matchingByCode) {
      console.log('Found property by property_code match:', matchingByCode.id);
      return matchingByCode;
    }
    
    console.log('No property found with ID or code:', propertyId);
    return null;
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    return null;
  }
};

// Fetch a property with its tenants
export const getPropertyWithTenants = async (propertyId: string): Promise<IPropertyWithTenants | null> => {
  try {
    console.log('Fetching property with tenants for ID:', propertyId);
    
    // First get the property
    const property = await getPropertyById(propertyId);
    if (!property) {
      console.error('No property found with ID:', propertyId);
      return null;
    }
    
    console.log('Found property, fetching tenants for property ID:', property.id);
    
    // For development mode, create mock tenants if none exist
    if (process.env.NODE_ENV === 'development') {
      return {
        ...property,
        tenants: [
          {
            id: 'e0de8dae-9008-4f45-b912-a87a8c186c30',
            name: 'Sarah Johnson',
            email: 'sarah.j@example.co.uk',
            phone: '07700 900456',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            about: 'Excellent tenant who always pays on time.',
            rent_amount: 1200
          },
          {
            id: '5f4a39d9-d92d-4fca-bba3-7e34b354fc0d',
            name: 'Emma Clarke',
            email: 'emma.c@example.co.uk',
            phone: '07700 900789',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            about: 'Generally good tenant, occasional late payments.',
            rent_amount: 1500
          }
        ]
      };
    }
    
    // Then get tenants using the custom function
    try {
      const { data: tenants, error } = await supabase
        .rpc('get_property_tenants', { prop_uuid: property.id });
      
      if (error) {
        console.error('Error fetching tenants from RPC:', error);
        // Return property with empty tenants array
        return {
          ...property,
          tenants: []
        };
      }
      
      console.log('Tenants fetched:', tenants?.length || 0);
      
      return {
        ...property,
        tenants: tenants || []
      };
    } catch (rpcError) {
      console.error('Exception during RPC call:', rpcError);
      // Return property with empty tenants array as fallback
      return {
        ...property,
        tenants: []
      };
    }
  } catch (error) {
    console.error(`Error fetching property with tenants ${propertyId}:`, error);
    return null;
  }
}; 