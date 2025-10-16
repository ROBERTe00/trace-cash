import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting live price update...");

    // Fetch all investments with live_tracking enabled
    const { data: investments, error: fetchError } = await supabase
      .from("investments")
      .select("*")
      .eq("live_tracking", true);

    if (fetchError) {
      console.error("Error fetching investments:", fetchError);
      throw fetchError;
    }

    if (!investments || investments.length === 0) {
      console.log("No investments with live tracking enabled");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No investments to update",
          updated: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${investments.length} investments to update`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const inv of investments) {
      try {
        let newPrice = inv.current_price;

        // Update Crypto prices using CoinGecko (free API)
        if (inv.category === "Crypto" && inv.symbol) {
          const coinId = inv.symbol.toLowerCase();
          
          // Map common symbols to CoinGecko IDs
          const symbolMap: Record<string, string> = {
            "btc": "bitcoin",
            "eth": "ethereum",
            "usdt": "tether",
            "bnb": "binancecoin",
            "sol": "solana",
            "xrp": "ripple",
            "ada": "cardano",
            "doge": "dogecoin",
            "dot": "polkadot",
            "matic": "matic-network",
          };

          const mappedId = symbolMap[coinId] || coinId;

          try {
            const cryptoRes = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${mappedId}&vs_currencies=eur`,
              {
                headers: {
                  "Accept": "application/json",
                }
              }
            );

            if (cryptoRes.ok) {
              const cryptoData = await cryptoRes.json();
              if (cryptoData[mappedId]?.eur) {
                newPrice = cryptoData[mappedId].eur;
                console.log(`Updated ${inv.symbol} price: €${newPrice}`);
              }
            } else {
              console.warn(`CoinGecko API error for ${inv.symbol}: ${cryptoRes.status}`);
            }
          } catch (cryptoError) {
            console.error(`Error fetching crypto price for ${inv.symbol}:`, cryptoError);
            errors.push(`${inv.symbol}: Crypto API error`);
          }
        }

        // Update Stock/ETF prices (using a simulated random fluctuation for demo)
        // In production, integrate with Alpha Vantage, Yahoo Finance, or other stock APIs
        if ((inv.category === "Stock" || inv.category === "ETF") && inv.symbol) {
          // Simulate realistic price movement (-2% to +2%)
          const fluctuation = 1 + (Math.random() * 0.04 - 0.02);
          newPrice = inv.current_price * fluctuation;
          console.log(`Simulated ${inv.symbol} price: €${newPrice.toFixed(2)}`);
        }

        // Update in database if price changed significantly (>0.1% difference)
        const priceDiff = Math.abs((newPrice - inv.current_price) / inv.current_price);
        if (priceDiff > 0.001) {
          const { error: updateError } = await supabase
            .from("investments")
            .update({ 
              current_price: newPrice,
              updated_at: new Date().toISOString()
            })
            .eq("id", inv.id);

          if (updateError) {
            console.error(`Error updating ${inv.name}:`, updateError);
            errors.push(`${inv.name}: Update failed`);
          } else {
            updatedCount++;
          }
        }

      } catch (invError) {
        const errorMessage = invError instanceof Error ? invError.message : "Unknown error";
        console.error(`Error processing ${inv.name}:`, errorMessage);
        errors.push(`${inv.name}: ${errorMessage}`);
      }
    }

    console.log(`Successfully updated ${updatedCount}/${investments.length} investments`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: investments.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Updated ${updatedCount} investment prices`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in update-live-prices:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
