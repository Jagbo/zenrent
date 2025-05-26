import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

// Define search result types
interface PropertySearchResult {
  id: string;
  name: string;
  address: string;
  type: "property";
  property_type?: string;
  bedrooms?: number;
  city?: string;
  postcode?: string;
}

interface TenantSearchResult {
  id: string;
  name: string;
  property: string;
  unit?: string;
  type: "resident";
  email?: string;
  phone?: string;
  property_id?: string;
}

interface PageSearchResult {
  id: string;
  name: string;
  path: string;
  type: "page";
}

type SearchResult = PropertySearchResult | TenantSearchResult | PageSearchResult;

// Static page results for navigation
const staticPages: PageSearchResult[] = [
  { id: "dashboard", name: "Dashboard", path: "/dashboard", type: "page" },
  { id: "properties", name: "Properties", path: "/properties", type: "page" },
  { id: "residents", name: "Residents", path: "/residents", type: "page" },
  { id: "issues", name: "Issues", path: "/issues", type: "page" },
  { id: "financial", name: "Financial", path: "/financial", type: "page" },
  { id: "calendar", name: "Calendar", path: "/calendar", type: "page" },
  { id: "suppliers", name: "Suppliers", path: "/suppliers", type: "page" },
  { id: "integrations", name: "Integrations", path: "/integrations", type: "page" },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Use createRouteHandlerClient for authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[SEARCH API] Error getting session:", sessionError);
      return NextResponse.json(
        { error: "Failed to get user session" },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchTerm = query.toLowerCase().trim();

    console.log(`[SEARCH API] Searching for "${searchTerm}" for user: ${userId}`);

    // Search properties
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, property_code, address, city, postcode, property_type, bedrooms")
      .eq("user_id", userId)
      .or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,postcode.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%`);

    if (propertiesError) {
      console.error("[SEARCH API] Error searching properties:", propertiesError);
    } else {
      console.log(`[SEARCH API] Found ${properties?.length || 0} properties`);
    }

    // Search tenants - using a simpler approach
    // First, get tenants that match the search term for this user
    const { data: matchingTenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, email, phone")
      .eq("user_id", userId)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

    if (tenantsError) {
      console.error("[SEARCH API] Error searching tenants:", tenantsError);
    } else {
      console.log(`[SEARCH API] Found ${matchingTenants?.length || 0} matching tenants`);
    }

    // Now get the active leases for these tenants to find their properties
    let tenantResults: TenantSearchResult[] = [];
    if (matchingTenants && matchingTenants.length > 0) {
      const tenantIds = matchingTenants.map(t => t.id);
      
      // Get active leases for these tenants
      const { data: activeLeases, error: leasesError } = await supabase
        .from("leases")
        .select("id, tenant_id, property_id")
        .in("tenant_id", tenantIds)
        .eq("status", "active");

      if (leasesError) {
        console.error("[SEARCH API] Error fetching leases:", leasesError);
      } else {
        console.log(`[SEARCH API] Found ${activeLeases?.length || 0} active leases`);
        
        // Get property details for the leases
        let propertyDetails: { id: string; address: string }[] = [];
        if (activeLeases && activeLeases.length > 0) {
          const propertyIds = activeLeases.map(l => l.property_id);
          const { data: properties, error: propError } = await supabase
            .from("properties")
            .select("id, address")
            .in("id", propertyIds);
          
          if (propError) {
            console.error("[SEARCH API] Error fetching property details:", propError);
          } else {
            propertyDetails = properties || [];
          }
        }
        
        // Transform to search results
        tenantResults = matchingTenants.map(tenant => {
          // Find the lease for this tenant
          const lease = activeLeases?.find(l => l.tenant_id === tenant.id);
          const property = propertyDetails.find(p => p.id === lease?.property_id);
          
          return {
            id: tenant.id,
            name: tenant.name,
            property: property?.address || "Unknown Property",
            type: "resident" as const,
            email: tenant.email,
            phone: tenant.phone,
            property_id: property?.id,
          };
        });
      }
    }

    // Transform properties to search results
    const propertyResults: PropertySearchResult[] = (properties || []).map(property => ({
      id: property.id,
      name: property.address || "Unknown Address",
      address: `${property.city || ""}, ${property.postcode || ""}`.trim().replace(/^,\s*/, ""),
      type: "property" as const,
      property_type: property.property_type,
      bedrooms: property.bedrooms,
      city: property.city,
      postcode: property.postcode,
    }));

    // Filter static pages
    const pageResults: PageSearchResult[] = staticPages.filter(page =>
      page.name.toLowerCase().includes(searchTerm)
    );

    // Combine all results
    const allResults: SearchResult[] = [
      ...propertyResults,
      ...tenantResults,
      ...pageResults,
    ];

    // Limit results to prevent overwhelming the UI
    const limitedResults = allResults.slice(0, 20);

    console.log(`[SEARCH API] Returning ${limitedResults.length} total results: ${propertyResults.length} properties, ${tenantResults.length} tenants, ${pageResults.length} pages`);

    return NextResponse.json({
      success: true,
      results: limitedResults,
      query: searchTerm,
    });

  } catch (error) {
    console.error("[SEARCH API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred: " + 
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
} 