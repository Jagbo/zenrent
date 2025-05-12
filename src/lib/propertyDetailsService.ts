import { supabase } from "./supabase";

// Interface for property images
export interface IPropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Interface for property floor plans
export interface IPropertyFloorPlan {
  id: string;
  property_id: string;
  floor_plan_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Interface for property insurance
export interface IPropertyInsurance {
  id: string;
  property_id: string;
  provider: string;
  coverage: number;
  premium: number;
  expiry_date: string;
  policy_number?: string;
  created_at: string;
  updated_at: string;
}

// Interface for property mortgages
export interface IPropertyMortgage {
  id: string;
  property_id: string;
  lender: string;
  amount: number;
  interest_rate: number;
  term_years: number;
  monthly_payment: number;
  start_date?: string;
  created_at: string;
  updated_at: string;
}

// Interface for property amenities
export interface IPropertyAmenity {
  id: string;
  property_id: string;
  amenity: string;
  created_at: string;
}

// Get property images
export const getPropertyImages = async (propertyId: string): Promise<IPropertyImage[]> => {
  try {
    console.log("Fetching images for property ID:", propertyId);
    
    const { data, error } = await supabase
      .from("property_images")
      .select("*")
      .eq("property_id", propertyId)
      .order("is_primary", { ascending: false });
    
    if (error) {
      console.error("Error fetching property images:", error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} images for property ${propertyId}`);
    return data || [];
  } catch (error) {
    console.error(`Error in getPropertyImages for ${propertyId}:`, error);
    return [];
  }
};

// Get property floor plans
export const getPropertyFloorPlans = async (propertyId: string): Promise<IPropertyFloorPlan[]> => {
  try {
    console.log("Fetching floor plans for property ID:", propertyId);
    
    const { data, error } = await supabase
      .from("property_floor_plans")
      .select("*")
      .eq("property_id", propertyId);
    
    if (error) {
      console.error("Error fetching property floor plans:", error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} floor plans for property ${propertyId}`);
    return data || [];
  } catch (error) {
    console.error(`Error in getPropertyFloorPlans for ${propertyId}:`, error);
    return [];
  }
};

// Get property insurance details
export const getPropertyInsurance = async (propertyId: string): Promise<IPropertyInsurance | null> => {
  try {
    console.log("Fetching insurance details for property ID:", propertyId);
    
    const { data, error } = await supabase
      .from("property_insurance")
      .select("*")
      .eq("property_id", propertyId)
      .single();
    
    if (error) {
      console.error("Error fetching property insurance:", error);
      return null;
    }
    
    console.log(`Found insurance details for property ${propertyId}`);
    return data;
  } catch (error) {
    console.error(`Error in getPropertyInsurance for ${propertyId}:`, error);
    return null;
  }
};

// Get property mortgage details
export const getPropertyMortgage = async (propertyId: string): Promise<IPropertyMortgage | null> => {
  try {
    console.log("Fetching mortgage details for property ID:", propertyId);
    
    const { data, error } = await supabase
      .from("property_mortgages")
      .select("*")
      .eq("property_id", propertyId)
      .single();
    
    if (error) {
      console.error("Error fetching property mortgage:", error);
      return null;
    }
    
    console.log(`Found mortgage details for property ${propertyId}`);
    return data;
  } catch (error) {
    console.error(`Error in getPropertyMortgage for ${propertyId}:`, error);
    return null;
  }
};

// Get property amenities
export const getPropertyAmenities = async (propertyId: string): Promise<string[]> => {
  try {
    console.log("Fetching amenities for property ID:", propertyId);
    
    const { data, error } = await supabase
      .from("property_amenities")
      .select("amenity")
      .eq("property_id", propertyId);
    
    if (error) {
      console.error("Error fetching property amenities:", error);
      throw error;
    }
    
    // Extract just the amenity strings from the results
    const amenities = data?.map(item => item.amenity) || [];
    console.log(`Found ${amenities.length} amenities for property ${propertyId}`);
    return amenities;
  } catch (error) {
    console.error(`Error in getPropertyAmenities for ${propertyId}:`, error);
    return [];
  }
};

// Get all property details in a single call
export const getAllPropertyDetails = async (propertyId: string) => {
  try {
    console.log("Fetching all details for property ID:", propertyId);
    
    const [images, floorPlans, insurance, mortgage, amenities] = await Promise.all([
      getPropertyImages(propertyId),
      getPropertyFloorPlans(propertyId),
      getPropertyInsurance(propertyId),
      getPropertyMortgage(propertyId),
      getPropertyAmenities(propertyId)
    ]);
    
    return {
      images,
      floorPlans,
      insurance,
      mortgage,
      amenities
    };
  } catch (error) {
    console.error(`Error in getAllPropertyDetails for ${propertyId}:`, error);
    return {
      images: [],
      floorPlans: [],
      insurance: null,
      mortgage: null,
      amenities: []
    };
  }
};
