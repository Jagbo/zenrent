import { supabase } from './supabase';
import { ITenant, ILease } from './propertyService';

export interface ITenantWithLease extends ITenant {
  lease: ILease;
  property_address?: string;
  property_city?: string;
  property_type?: string;
}

// Development mode test user ID
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// Fetch all tenants for the current user
export const getTenants = async (userId?: string): Promise<ITenant[]> => {
  try {
    // In development mode, use the test user ID if no user ID is provided
    const effectiveUserId = process.env.NODE_ENV === 'development' 
      ? TEST_USER_ID 
      : userId;
    
    if (!effectiveUserId) {
      console.error('No user ID provided and not in development mode');
      return [];
    }

    // First get all properties for this user
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, property_code, address')
      .eq('user_id', effectiveUserId);
    
    if (propError) throw propError;
    if (!properties || properties.length === 0) return [];
    
    // Then get all active leases for these properties with property details
    const propertyIds = properties.map(p => p.id);
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select(`
        tenant_id,
        property_id,
        property_uuid
      `)
      .in('property_uuid', propertyIds)
      .eq('status', 'active');
    
    if (leaseError) throw leaseError;
    if (!leases || leases.length === 0) return [];
    
    // Map properties to their codes for easy lookup
    interface PropertyInfo {
      property_code: string;
      address: string;
    }
    
    const propertyMap: Record<string, PropertyInfo> = properties.reduce((acc: Record<string, PropertyInfo>, property) => {
      acc[property.id] = { 
        property_code: property.property_code,
        address: property.address
      };
      return acc;
    }, {});
    
    // Finally get all tenant details
    const tenantIds = leases.map(l => l.tenant_id);
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .in('id', tenantIds);
    
    if (tenantError) throw tenantError;
    
    // Add property details to each tenant
    return (tenants || []).map(tenant => {
      const lease = leases.find(l => l.tenant_id === tenant.id);
      const property = lease && lease.property_uuid ? propertyMap[lease.property_uuid] : null;
      
      return {
        ...tenant,
        property_id: lease?.property_id,
        property_code: property?.property_code,
        property_address: property?.address
      };
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
};

// Fetch a single tenant by ID
export const getTenantById = async (tenantId: string): Promise<ITenant | null> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching tenant ${tenantId}:`, error);
    return null;
  }
};

// Fetch tenant with their lease and property details
export const getTenantWithLease = async (tenantId: string): Promise<ITenantWithLease | null> => {
  try {
    // First get the tenant
    const tenant = await getTenantById(tenantId);
    if (!tenant) return null;
    
    // Then get active lease for this tenant
    const { data: leaseData, error: leaseError } = await supabase
      .from('leases')
      .select(`
        *,
        properties:property_uuid (
          address,
          city,
          property_type
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();
    
    if (leaseError && leaseError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw leaseError;
    }
    
    if (!leaseData) {
      return {
        ...tenant,
        lease: {} as ILease
      };
    }
    
    const { properties, ...lease } = leaseData;
    
    return {
      ...tenant,
      lease: lease as ILease,
      property_address: properties?.address,
      property_city: properties?.city,
      property_type: properties?.property_type
    };
  } catch (error) {
    console.error(`Error fetching tenant with lease ${tenantId}:`, error);
    return null;
  }
}; 