import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import getConfig from "next/config";

const { serverRuntimeConfig } = getConfig();

// Create a Supabase client that uses service role key
const getDashboardClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = serverRuntimeConfig.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
};

export async function GET(request: Request) {
  try {
    // Get user ID from the request URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    console.log("Dashboard API: Fetching data for user:", userId);

    // Original code continues below for production
    const { data: properties, error: propertiesError } =
      await getDashboardClient()
        .from("properties")
        .select("id, property_code")
        .eq("user_id", userId);

    if (propertiesError) {
      console.error("Error fetching properties:", propertiesError);
      return NextResponse.json(
        { error: "Failed to fetch properties" },
        { status: 500 },
      );
    }

    const totalProperties = properties?.length || 0;
    console.log("Dashboard API: Total properties found:", totalProperties);

    // Extract property IDs
    const propertyIds = properties?.map((p) => p.id) || [];
    console.log("Dashboard API: Property IDs:", propertyIds);

    // Get expiring contracts using property IDs
    let expiringContracts = 0;
    let occupancyRate = 0;
    let currentMonthIncome = 0;

    if (propertyIds.length > 0) {
      console.log("Dashboard API: Checking all leases for properties");

      // Get all leases for these properties
      const { data: allLeases, error: allLeasesError } =
        await getDashboardClient()
          .from("leases")
          .select(
            `
          id,
          property_id,
          status,
          end_date,
          rent_amount
        `,
          )
          .eq("status", "active")
          .in("property_id", propertyIds);

      if (allLeasesError) {
        console.error(
          "Dashboard API: Error fetching all leases:",
          allLeasesError,
        );
        console.error("Dashboard API: Query details:", {
          propertyIds,
        });
      } else {
        console.log("Dashboard API: Raw leases data:", allLeases);

        if (!allLeases || allLeases.length === 0) {
          console.log("Dashboard API: No active leases found for properties");
        } else {
          // Filter for active leases that haven't ended
          const today = new Date();
          const activeLeases = allLeases.filter((lease) => {
            const endDate = new Date(lease.end_date);
            const isActive = endDate >= today;
            console.log("Dashboard API: Lease check:", {
              leaseId: lease.id,
              endDate: lease.end_date,
              isActive,
              rentAmount: lease.rent_amount,
            });
            return isActive;
          });

          console.log("Dashboard API: Active leases:", activeLeases.length);

          // Calculate expiring contracts (active leases ending in next 30 days)
          const thirtyDaysLater = new Date(today);
          thirtyDaysLater.setDate(today.getDate() + 30);

          const expiringLeases = activeLeases.filter((lease) => {
            const endDate = new Date(lease.end_date);
            return endDate <= thirtyDaysLater;
          });

          // Calculate metrics
          expiringContracts = expiringLeases.length;

          // Calculate occupancy rate based on properties with active leases
          const uniquePropertiesWithLeases = new Set(
            activeLeases.map((lease) => lease.property_id),
          );

          occupancyRate =
            totalProperties > 0
              ? Math.round(
                  (uniquePropertiesWithLeases.size / totalProperties) * 100,
                )
              : 0;

          // Calculate current month income from active leases
          currentMonthIncome = activeLeases.reduce((sum, lease) => {
            const amount =
              typeof lease.rent_amount === "string"
                ? parseFloat(lease.rent_amount)
                : lease.rent_amount || 0;

            console.log("Dashboard API: Processing rent amount:", {
              leaseId: lease.id,
              originalAmount: lease.rent_amount,
              parsedAmount: amount,
            });

            return sum + amount;
          }, 0);

          console.log("Dashboard API: Final calculations:", {
            totalProperties,
            uniquePropertiesWithLeases: Array.from(uniquePropertiesWithLeases),
            activeLeases: activeLeases.length,
            expiringLeases: expiringLeases.length,
            occupancyRate,
            currentMonthIncome,
            leaseDetails: activeLeases.map((l) => ({
              id: l.id,
              property_id: l.property_id,
              rent_amount: l.rent_amount,
              end_date: l.end_date,
            })),
          });
        }
      }
    } else {
      console.log("Dashboard API: No properties found to check leases for");
    }

    const response = {
      totalProperties,
      expiringContracts,
      occupancyRate,
      currentMonthIncome,
    };

    console.log("Dashboard API: Returning response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
