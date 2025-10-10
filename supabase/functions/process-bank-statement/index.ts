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
    
    // Validate file size (10MB limit)
    const fileSizeInMB = fileBuffer.byteLength / (1024 * 1024);
    if (fileSizeInMB > 10) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 10MB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate PDF magic bytes (%PDF-)
    const uint8Array = new Uint8Array(fileBuffer);
    if (uint8Array[0] !== 0x25 || uint8Array[1] !== 0x50 || 
        uint8Array[2] !== 0x44 || uint8Array[3] !== 0x46) {
      return new Response(
        JSON.stringify({ error: "Invalid PDF file format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const base64File = btoa(String.fromCharCode(...uint8Array));

    // Use Lovable AI to extract and categorize transactions with PDF content
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
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this bank statement PDF and extract all transactions.

Categories to use:
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
2. Description (brief, max 100 chars)
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

IMPORTANT:
- Return ONLY the JSON array, no markdown, no explanations
- Use negative amounts for expenses
- Use positive amounts for income/deposits
- If no transactions found, return empty array: []`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64File}`
                }
              }
            ]
          }
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
    console.error("Processing failed:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process bank statement. Please try again or contact support if the issue persists." 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});