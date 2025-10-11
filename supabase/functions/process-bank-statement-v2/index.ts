import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const { fileUrl, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting bank statement processing:", fileName);

    // Fetch the PDF file
    const fileResponse = await fetch(fileUrl, { signal: controller.signal });
    if (!fileResponse.ok) {
      console.error("Failed to fetch file, status:", fileResponse.status);
      throw new Error("Failed to fetch file");
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileSizeInMB = fileBuffer.byteLength / (1024 * 1024);
    console.log("File size (MB):", fileSizeInMB.toFixed(2));
    
    if (fileSizeInMB > 10) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 10MB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate PDF magic bytes
    const uint8Array = new Uint8Array(fileBuffer);
    if (uint8Array[0] !== 0x25 || uint8Array[1] !== 0x50 || 
        uint8Array[2] !== 0x44 || uint8Array[3] !== 0x46) {
      return new Response(
        JSON.stringify({ error: "Invalid PDF file format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable Document Parser API instead of trying to send PDF as image
    console.log("Parsing PDF with Document Parser...");
    const parseResponse = await fetch("https://api.lovable.app/v1/parse-document", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/pdf",
      },
      body: fileBuffer,
      signal: controller.signal
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("Parse API error:", parseResponse.status, errorText);
      throw new Error(`Document parsing failed: ${parseResponse.status}`);
    }

    const parseData = await parseResponse.json();
    const extractedText = parseData.text || "";
    console.log("Extracted text length:", extractedText.length);

    // Now send the extracted text to AI for transaction extraction
    console.log("Calling AI for transaction extraction...");
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
            content: `You are a financial data extraction assistant. Extract ALL transactions from the bank statement text.
Return ONLY a JSON array with this EXACT structure, no markdown, no code blocks:
[
  {
    "date": "YYYY-MM-DD",
    "description": "Transaction description",
    "amount": number (positive for income, negative for expenses),
    "category": "one of: Shopping, Transport, Food, Bills, Entertainment, Healthcare, Other",
    "payee": "Merchant or payee name"
  }
]

CRITICAL RULES:
1. Return ONLY the JSON array
2. Extract ALL transactions
3. Negative for expenses, positive for income
4. Dates in YYYY-MM-DD format
5. Match categories exactly`
          },
          {
            role: "user",
            content: `Extract all transactions from this bank statement:\n\n${extractedText}`
          }
        ],
        max_tokens: 16000,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let transactions = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
      } else {
        transactions = JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      transactions = [];
    }

    console.log("Processing complete, returning", transactions.length, "transactions");

    return new Response(
      JSON.stringify({ transactions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Processing failed:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          error: "Il file è troppo grande o la richiesta ha impiegato troppo tempo. Prova con un file più piccolo." 
        }),
        { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process bank statement. Please try again." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    clearTimeout(timeoutId);
  }
});
