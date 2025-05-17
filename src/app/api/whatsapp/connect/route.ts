import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios, { AxiosError } from "axios";
import { getAuthUser } from "@/lib/auth-helpers";

// Initialize Supabase client with local environment values
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const supabase = createClient(supabaseUrl, supabaseKey);

// Facebook Graph API configuration
const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const APP_ID = process.env.FB_APP_ID || "953206047023164";
const APP_SECRET = process.env.FB_APP_SECRET;

interface WabaDetails {
  name?: string;
  owner_business_id?: string;
  // Add other potential fields if needed
}

interface PhoneDetails {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  status?: string;
  // Add other potential fields if needed
}

export async function POST(request: Request) {
  console.log("Processing WhatsApp connection request");
  
  try {
    // Get the user ID from session/auth
    const user = await getAuthUser();
    if (!user) {
      console.error("WhatsApp connect: No authenticated user found");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = user.id;
    console.log(`WhatsApp connect for user ${userId}`);

    // Parse the request body
    const body = await request.json();
    // If wabaId is coming from frontend, use it, otherwise use configured WABA ID
    const wabaId = body.wabaId || process.env.WHATSAPP_WABA_ID || '596136450071721';

    if (!wabaId) {
      console.error("WhatsApp connect: Missing wabaId in request");
      return NextResponse.json(
        { success: false, error: "WABA ID is required" },
        { status: 400 }
      );
    }
    console.log(`Processing connection for WABA ID: ${wabaId}`);

    // Get token from environment (System User Token approach)
    const accessToken = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
    if (!accessToken) {
      console.error("WhatsApp connect: Missing WHATSAPP_SYSTEM_USER_TOKEN");
      return NextResponse.json(
        { success: false, error: "WhatsApp API token not configured" },
        { status: 500 }
      );
    }

    // 1. Subscribe your app to the WABA
    console.log(`Subscribing app to WABA ${wabaId}`);
    try {
      const subscribeResponse = await axios.post(
        `${GRAPH_API_URL}/${wabaId}/subscribed_apps`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      console.log("App subscribed to WABA successfully", subscribeResponse.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error subscribing to WABA:",
        axiosError.response?.data || axiosError.message
      );
      // Continue anyway as this might be a permission issue or already subscribed
    }

    // 2. Get WABA details
    let wabaDetails: WabaDetails = {};
    try {
      const wabaResponse = await axios.get<WabaDetails>(
        `${GRAPH_API_URL}/${wabaId}?fields=name,owner_business_id`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      wabaDetails = wabaResponse.data;
      console.log("WABA details retrieved:", wabaDetails);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error getting WABA details:",
        axiosError.response?.data || axiosError.message
      );
      // Continue anyway, we still have the WABA ID
    }

    // 3. Get phone numbers for this WABA
    let phoneDetails: PhoneDetails = {};
    let phoneNumber = "";
    try {
      const phonesResponse = await axios.get(
        `${GRAPH_API_URL}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,status`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      const phones = phonesResponse.data.data;
      console.log("Phone numbers retrieved:", phones);
      
      if (phones && phones.length > 0) {
        phoneDetails = phones[0];
        phoneNumber = phoneDetails.display_phone_number || "";
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "Error getting phone details:",
        axiosError.response?.data || axiosError.message
      );
      // Continue anyway, the phone might be added later
    }

    // 4. Store the connection info in the database
    try {
      const { error: upsertError } = await supabase
        .from("whatsapp_integrations")
        .upsert({
          user_id: userId,
          waba_id: wabaId,
          phone_id: phoneDetails.id || null,
          phone_number: phoneNumber,
          business_name: wabaDetails.name || null,
          status: "connected",
          connected_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error("Database error storing WhatsApp integration:", upsertError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to store WhatsApp integration data",
          },
          { status: 500 }
        );
      }
      
      console.log("WhatsApp integration stored successfully for user", userId);
    } catch (error) {
      console.error("Error storing WhatsApp integration:", error);
      return NextResponse.json(
        { success: false, error: "Database error" },
        { status: 500 }
      );
    }

    // 5. Return success with phone details if available
    return NextResponse.json({
      success: true,
      wabaId,
      phoneId: phoneDetails.id,
      phoneNumber,
      businessName: wabaDetails.name,
    });
  } catch (error) {
    console.error("Unexpected error in WhatsApp connection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

interface WhatsAppAccount {
    waba_id: string;
    phone_number_id: string;
    phone_number: string;
    business_name: string | null;
    connected_at: string;
    status: string;
    // Define other fields if selected with '*'
}

export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const user = await getAuthUser();
    if (!user) {
        // Return connected: false if not authenticated, or handle as error
      return NextResponse.json({ connected: false, reason: "Unauthorized" });
    }
    const userId = user.id;

    // Get the user's WhatsApp account
    const { data, error } = await supabase
      .from("whatsapp_accounts")
      .select(
          "waba_id, phone_number_id, phone_number, business_name, connected_at, status"
      )
      .eq("user_id", userId)
      .eq("status", "connected")
      .order("connected_at", { ascending: false })
      .maybeSingle<WhatsAppAccount>();

    if (error) {
      console.error("Error fetching WhatsApp account for user:", userId, error);
      return NextResponse.json(
        { error: "Failed to fetch WhatsApp configuration" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ connected: false });
    }

    // Return only necessary, non-sensitive data
    return NextResponse.json({
      connected: true,
      account: {
          wabaId: data.waba_id,
          phoneNumberId: data.phone_number_id,
          phoneNumber: data.phone_number,
          businessName: data.business_name || "",
          connectedAt: data.connected_at
      },
    });
  } catch (error) {
    console.error("Error fetching WhatsApp connection:", error);
    // Provide specific error message
    const message = error instanceof Error ? error.message : "Unknown error fetching connection";
    return NextResponse.json(
      { error: `Failed to fetch WhatsApp configuration: ${message}` },
      { status: 500 },
    );
  }
}
