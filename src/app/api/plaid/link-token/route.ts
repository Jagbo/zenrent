import { NextResponse } from "next/server";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

// Initialize Plaid client
const configuration = new Configuration({
  basePath:
    PlaidEnvironments[
      (process.env.NEXT_PUBLIC_PLAID_ENV as keyof typeof PlaidEnvironments) ||
        "sandbox"
    ],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.NEXT_PUBLIC_PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    // Get user from auth
    const { properties } = await request.json();

    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json(
        { error: "Properties array is required" },
        { status: 400 },
      );
    }

    // Log configuration for debugging
    console.log("Plaid Configuration:", {
      env: process.env.NEXT_PUBLIC_PLAID_ENV,
      clientId: process.env.NEXT_PUBLIC_PLAID_CLIENT_ID?.slice(0, 8) + "...",
      hasSecret: !!process.env.PLAID_SECRET,
      webhookUrl: process.env.PLAID_WEBHOOK_URL,
      redirectUri: process.env.NEXT_PUBLIC_PLAID_REDIRECT_URI,
    });

    // Create the link token with configs
    try {
      const createTokenResponse = await plaidClient.linkTokenCreate({
        user: {
          // Generate a unique client_user_id for this user session
          client_user_id: Date.now().toString(),
        },
        client_name: "ZenRent",
        products: ["auth", "transactions"] as Products[],
        country_codes: ["GB"] as CountryCode[],
        language: "en",
        webhook: process.env.PLAID_WEBHOOK_URL,
        redirect_uri: process.env.NEXT_PUBLIC_PLAID_REDIRECT_URI,
      });

      console.log("Link token created successfully");

      return NextResponse.json({
        link_token: createTokenResponse.data.link_token,
      });
    } catch (plaidError: unknown) {
      console.error("Plaid API Error:", {
        error: plaidError,
        response: plaidError.response?.data,
      });

      return NextResponse.json(
        {
          error: "Plaid API Error",
          details: plaidError.response?.data || plaidError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error creating link token:", error);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 },
    );
  }
}
