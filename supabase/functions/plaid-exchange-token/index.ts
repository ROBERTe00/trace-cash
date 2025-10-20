/**
 * Plaid Exchange Token Edge Function
 * Exchanges public token for access token and fetches account details
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, PlaidApi, PlaidEnvironments } from "npm:plaid@21.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { public_token, user_id } = await req.json();

    if (!public_token || !user_id) {
      return new Response(
        JSON.stringify({ error: "public_token and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Plaid credentials
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

    // Exchange public token for access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    console.log("✅ [Plaid] Token exchanged successfully");

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts.map((account) => ({
      account_id: account.account_id,
      name: account.name,
      official_name: account.official_name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      balance_current: account.balances.current,
      balance_available: account.balances.available,
    }));

    // Store access token securely in Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Encrypt and store access token
    const { error: insertError } = await supabase.from("plaid_items").upsert({
      user_id,
      item_id: itemId,
      access_token: accessToken, // In production, encrypt this!
      status: "active",
      last_sync: new Date().toISOString(),
    });

    if (insertError) {
      console.error("❌ [Plaid] Failed to store item:", insertError);
      throw new Error("Failed to store connection");
    }

    console.log(`✅ [Plaid] Stored ${accounts.length} accounts for user ${user_id}`);

    return new Response(
      JSON.stringify({
        item_id: itemId,
        accounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [Plaid] Error exchanging token:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to exchange token",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

