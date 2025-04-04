import { supabase } from "./supabase";
import { getCurrentUserId } from "./auth-provider";

export interface IProperty {
  id: string;
  name?: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  postcode: string;
  property_type: string;
  status?: string;
  bedrooms: number;
  bathrooms: number;
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
  property_code: string;
  has_garden?: boolean;
  has_parking?: boolean;
  is_furnished?: boolean;
  metadata?: {
    amenities?: string[];
    year_built?: number;
    square_footage?: number;
    [key: string]: unknown;
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

// Fetch all properties for a specific user
export const getProperties = async (userId?: string): Promise<IProperty[]> => {
  try {
    // Get the current user ID if not provided
    const effectiveUserId = userId || (await getCurrentUserId());

    if (!effectiveUserId) {
      console.error("No user ID provided and not authenticated");
      return [];
    }

    console.log("Fetching properties for user:", effectiveUserId);

    // Attempt to fetch from the database
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", effectiveUserId);

    if (error) {
      console.error("Error fetching properties from Supabase:", error);
      throw error;
    }

    console.log("Properties fetched from Supabase:", data?.length || 0);

    // If we have data from the database, return it
    if (data && data.length > 0) {
      if (data[0]) {
        console.log("First property from DB:", {
          id: data[0].id,
          name: data[0].address,
          property_code: data[0].property_code,
        });
      }
      return data;
    }

    // If no data was found in the database, log a warning
    console.warn(
      "No properties found in the database for user:",
      effectiveUserId,
    );

    // In production, return empty array if no properties found
    return [];
  } catch (error) {
    console.error("Error in getProperties:", error);
    return [];
  }
};

// Fetch all properties direct (debug)
export const getAllProperties = async (): Promise<IProperty[]> => {
  try {
    console.log("DEBUG: Fetching ALL properties");
    const { data, error } = await supabase.from("properties").select("*");

    if (error) {
      console.error("Error fetching all properties:", error);
      throw error;
    }

    console.log("All properties fetched:", data?.length || 0);
    if (data && data.length > 0) {
      console.log(
        "Property IDs:",
        data.map((p: IProperty) => p.id),
      );
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching all properties:", error);
    return [];
  }
};

// Fetch a single property by ID
export const getPropertyById = async (
  propertyId: string,
): Promise<IProperty | null> => {
  try {
    console.log("Fetching property by ID:", propertyId);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (error) {
      console.error(`Error fetching property ${propertyId}:`, error);

      // Try by property code if ID lookup fails
      const { data: dataByCode, error: errorByCode } = await supabase
        .from("properties")
        .select("*")
        .eq("property_code", propertyId)
        .single();

      if (errorByCode) {
        console.error(
          `Error fetching property by code ${propertyId}:`,
          errorByCode,
        );
        return null;
      }

      return dataByCode;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    return null;
  }
};

// Helper function to generate UI Avatar URL
const getAvatarUrl = (name: string) => {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random`;
};

// Helper function to validate image URL
const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;

  // List of allowed domains from next.config.js
  const allowedDomains = [
    "images.unsplash.com",
    "picsum.photos",
    "ui-avatars.com",
  ];

  try {
    const urlObj = new URL(url);
    return allowedDomains.includes(urlObj.hostname);
  } catch {
    return false;
  }
};

// Fetch a property with its tenants
export const getPropertyWithTenants = async (
  propertyId: string,
): Promise<IPropertyWithTenants | null> => {
  try {
    console.log("Fetching property with tenants for ID:", propertyId);

    // First get the property
    const property = await getPropertyById(propertyId);
    if (!property) {
      console.error("No property found with ID:", propertyId);
      return null;
    }

    console.log(
      "Found property, fetching tenants for property ID:",
      property.id,
    );

    interface LeaseWithTenant {
      tenant_id: string;
      tenants: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        photo_url?: string;
        status?: string;
      };
    }

    // Get tenants for this property by joining through the leases table
    const { data: tenantData, error: tenantsError } = await supabase
      .from("leases")
      .select(
        `
        tenant_id,
        tenants:tenant_id (
          id,
          name,
          email,
          phone,
          photo_url,
          status
        )
      `,
      )
      .eq("property_id", property.id)
      .eq("status", "active");

    if (tenantsError) {
      console.error(
        `Error fetching tenants for property ${property.id}:`,
        tenantsError,
      );
      return {
        ...property,
        tenants: [],
      };
    }

    // Transform the joined data to match ITenant interface
    const tenants =
      (tenantData as LeaseWithTenant[] | null)?.map((lease) => {
        const photoUrl = lease.tenants.photo_url;
        const validatedImage = isValidImageUrl(photoUrl)
          ? photoUrl
          : getAvatarUrl(lease.tenants.name);

        return {
          id: lease.tenants.id,
          name: lease.tenants.name,
          email: lease.tenants.email,
          phone: lease.tenants.phone,
          image: validatedImage,
          status: lease.tenants.status,
          property_id: property.id,
          property_address: property.address,
          property_code: property.property_code,
        };
      }) || [];

    return {
      ...property,
      tenants: tenants,
    };
  } catch (error) {
    console.error(`Error fetching property with tenants ${propertyId}:`, error);
    return null;
  }
};
