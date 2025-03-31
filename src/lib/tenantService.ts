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

    // For development mode, return mock data if needed
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback tenant data for development');
      
      // Mock data that matches our database structure
      return [
        {
          id: 'e0de8dae-9008-4f45-b912-a87a8c186c30',
          name: 'Sarah Johnson',
          email: 'sarah.j@example.co.uk',
          phone: '07700 900456',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          about: 'Excellent tenant who always pays on time.',
          property_address: '15 Crescent Road',
          property_id: 'prop_15_crescent_road',
          property_code: 'prop_15_crescent_road'
        },
        {
          id: '5f4a39d9-d92d-4fca-bba3-7e34b354fc0d',
          name: 'Emma Clarke',
          email: 'emma.c@example.co.uk',
          phone: '07700 900789',
          image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          about: 'Generally good tenant, occasional late payments.',
          property_address: '42 Harley Street',
          property_id: 'prop_42_harley_street',
          property_code: 'prop_42_harley_street'
        },
        {
          id: 'c5bdc148-c9e3-4c4f-a9e7-18462b28e53e',
          name: 'David Wilson',
          email: 'david.w@example.co.uk',
          phone: '07700 900234',
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          about: 'Reliable tenant with good property maintenance.',
          property_address: '8 Victoria Gardens',
          property_id: 'prop_8_victoria_gardens',
          property_code: 'prop_8_victoria_gardens'
        }
      ];
    }
    
    // First get all properties for this user
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, property_code, address')
      .eq('user_id', effectiveUserId);
    
    if (propError) {
      console.error('Error fetching properties for tenants:', propError);
      throw propError;
    }

    if (!properties || properties.length === 0) {
      console.log('No properties found for user, returning empty tenants array');
      return [];
    }
    
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