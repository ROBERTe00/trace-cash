import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Log processing start (no sensitive data)
    console.log("Processing bank statement upload");

    // Fetch the PDF file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error("Failed to fetch file");
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // Use Lovable AI to extract and categorize transactions
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a bank statement analyzer. Extract transactions and categorize them.

Categories:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Healthcare
- Bills & Utilities
- Income
- Other

For each transaction, extract:
1. Date (format: YYYY-MM-DD)
2. Description (brief)
3. Amount (positive for income, negative for expenses)
4. Category (from list above)
5. Payee (merchant/company name)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "date": "2024-01-15",
    "description": "Grocery Store",
    "amount": -50.25,
    "category": "Food & Dining",
    "payee": "SuperMarket XYZ"
  }
]

Important:
- Return ONLY the JSON array, no other text
- Use negative amounts for expenses
- Use positive amounts for income
- If you cannot extract transactions, return an empty array: []`,
          },
          {
            role: "user",
            content: `Please analyze this bank statement PDF and extract all transactions: ${fileName}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // AI response received (no sensitive data logged)

    // Parse the JSON response
    let transactions = [];
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
      } else {
        transactions = JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to parse AI response");
      transactions = [];
    }

    return new Response(
      JSON.stringify({ transactions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Processing failed");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});