import { Configuration, PlaidApi, PlaidEnvironments, Products } from "plaid";
import { NextResponse } from "next/server";

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
      "Plaid-Version": "2020-09-14",
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    const { country_codes, language } = await request.json();

    // Log configuration for debugging
    console.log("Plaid Configuration:", {
      env: process.env.NEXT_PUBLIC_PLAID_ENV,
      clientId: process.env.NEXT_PUBLIC_PLAID_CLIENT_ID?.slice(0, 8) + "...",
      hasSecret: !!process.env.PLAID_SECRET,
      webhookUrl: process.env.PLAID_WEBHOOK_URL,
    });

    const createTokenResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: Date.now().toString() },
      client_name: "ZenRent",
      products: [Products.Auth, Products.Transactions],
      country_codes: country_codes,
      language: language,
      webhook: process.env.PLAID_WEBHOOK_URL,
    });

    return NextResponse.json({
      link_token: createTokenResponse.data.link_token,
    });
  } catch (error: unknown) {
    console.error("Error creating link token:", error.response?.data || error);
    return NextResponse.json(
      {
        error: "Failed to create link token",
        details: error.response?.data || error.message,
      },
      { status: 500 },
    );
  }
}
