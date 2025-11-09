/**
 * Plaid Create Link Token Edge Function
 * Creates a link token for Plaid Link initialization
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "npm:plaid@39.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Plaid credentials from environment
    const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
    const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
    const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error("Plaid credentials not configured");
    }

    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: PlaidEnvironments[PLAID_ENV],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
          "PLAID-SECRET": PLAID_SECRET,
        },
      },
    });

    const plaidClient = new PlaidApi(configuration);

    // Create link token
    const request = {
      user: {
        client_user_id: user_id,
      },
      client_name: "TraceCash",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us, CountryCode.It, CountryCode.Gb],
      language: "en",
    };

    const response = await plaidClient.linkTokenCreate(request);

    console.log("✅ [Plaid] Link token created for user:", user_id);

    return new Response(
      JSON.stringify({
        link_token: response.data.link_token,
        expiration: response.data.expiration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [Plaid] Error creating link token:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to create link token",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

