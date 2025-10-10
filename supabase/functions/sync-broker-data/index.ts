import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  asset_class: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, apiSecret, broker } = await req.json();

    if (!apiKey || !apiSecret) {
      throw new Error("API credentials required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let positions: any[] = [];

    if (broker === "alpaca") {
      // Fetch Alpaca positions
      const alpacaResponse = await fetch(
        "https://paper-api.alpaca.markets/v2/positions",
        {
          headers: {
            "APCA-API-KEY-ID": apiKey,
            "APCA-API-SECRET-KEY": apiSecret,
          },
        }
      );

      if (!alpacaResponse.ok) {
        throw new Error("Failed to fetch Alpaca data");
      }

      const alpacaPositions: AlpacaPosition[] = await alpacaResponse.json();

      // Transform to our format
      positions = alpacaPositions.map(pos => ({
        user_id: user.id,
        name: pos.symbol,
        type: pos.asset_class === "crypto" ? "Cryptocurrency" : "Stock",
        quantity: parseFloat(pos.qty),
        purchase_price: parseFloat(pos.avg_entry_price),
        current_price: parseFloat(pos.current_price),
        symbol: pos.symbol,
        live_tracking: true,
      }));
    }

    // Upsert investments
    const { error: upsertError } = await supabase
      .from("investments")
      .upsert(positions, { 
        onConflict: "user_id,symbol",
        ignoreDuplicates: false 
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: positions.length,
        positions 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Broker sync error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to sync broker data. Please verify your credentials and try again." 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
