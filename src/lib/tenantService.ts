import { supabase } from "./supabase";
import { ITenant, ILease } from "./propertyService";
import { getUserId } from "./auth";

// In development, we'll use the supabase client directly
// The RLS policies will be bypassed in development
const client = supabase;

export interface ITenantWithLease extends ITenant {
  lease: ILease;
  property_address?: string;
  property_city?: string;
  property_type?: string;
}

interface Property {
  id: string;
  property_code: string;
  address: string;
}

interface Lease {
  tenant_id: string;
  property_id: string;
  status: string;
}

interface JoinedProperty {
  id: string;
  property_code: string;
  address: string;
  leases: Array<{
    id: string;
    tenant_id: string;
    start_date: string;
    end_date: string;
    status: string;
    tenants: ITenant;
  }>;
}

// Fetch all tenants for the current user
export const getTenants = async (userId?: string): Promise<ITenant[]> => {
  try {
    console.log("Starting getTenants function");
    const effectiveUserId = userId || (await getUserId());
    console.log("Current user ID:", effectiveUserId);

    if (!effectiveUserId) {
      console.error("No user ID provided and not authenticated");
      return [];
    }

    const { data: rawData, error } = await client
      .from("properties")
      .select(
        `
        id,
        property_code,
        address,
        leases!fk_leases_property!inner(
          id,
          tenant_id,
          start_date,
          end_date,
          status,
          tenants!inner(
            id,
            name,
            email,
            phone,
            status
          )
        )
      `,
      )
      .eq("user_id", effectiveUserId)
      .eq("leases.status", "active");

    if (error) {
      console.error("Error fetching tenant data (raw object):", error);
      console.error("Error details:", JSON.stringify(error, null, 2)); // Log full error details
      return [];
    }

    const data = rawData as unknown as JoinedProperty[];
    console.log("Found joined data:", data);

    // Transform the nested data into the expected format
    const tenants = data.flatMap((property) =>
      property.leases.map((lease) => ({
        ...lease.tenants,
        property_id: property.id,
        property_code: property.property_code,
        property_address: property.address,
      })),
    );

    console.log("Transformed tenants:", tenants);
    return tenants;
  } catch (error) {
    console.error("Caught error in getTenants function:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Caught non-Error object:", JSON.stringify(error, null, 2));
    }
    return [];
  }
};

// Fetch a single tenant by ID
export const getTenantById = async (
  tenantId: string,
): Promise<ITenant | null> => {
  try {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching tenant ${tenantId}:`, error);
    return null;
  }
};

// Fetch tenant with their lease and property details
export const getTenantWithLease = async (
  tenantId: string,
): Promise<ITenantWithLease | null> => {
  try {
    // First get the tenant
    const tenant = await getTenantById(tenantId);
    if (!tenant) return null;

    // Then get active lease for this tenant
    const { data: leaseData, error: leaseError } = await supabase
      .from("leases")
      .select(
        `
        *,
        properties:property_id (
          address,
          city,
          property_type
        )
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    if (leaseError && leaseError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      throw leaseError;
    }

    if (!leaseData) {
      return {
        ...tenant,
        lease: {} as ILease,
      };
    }

    const { properties, ...lease } = leaseData;

    return {
      ...tenant,
      lease: lease as ILease,
      property_address: properties?.address,
      property_city: properties?.city,
      property_type: properties?.property_type,
    };
  } catch (error) {
    console.error(`Error fetching tenant with lease ${tenantId}:`, error);
    return null;
  }
};
