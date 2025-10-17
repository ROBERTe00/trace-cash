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
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

  try {
    const { fileUrl, fileName } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Starting bank statement processing:", fileName);

    // Fetch the PDF file with timeout
    const fileResponse = await fetch(fileUrl, { signal: controller.signal });
    if (!fileResponse.ok) {
      console.error("Failed to fetch file, status:", fileResponse.status);
      throw new Error("Failed to fetch file");
    }

    console.log("File fetched successfully");

    const fileBuffer = await fileResponse.arrayBuffer();
    console.log("File buffer size (bytes):", fileBuffer.byteLength);
    
    // Validate file size (10MB limit)
    const fileSizeInMB = fileBuffer.byteLength / (1024 * 1024);
    console.log("File size (MB):", fileSizeInMB.toFixed(2));
    
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
      console.error("Invalid PDF magic bytes:", uint8Array.slice(0, 4));
      return new Response(
        JSON.stringify({ error: "Invalid PDF file format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Valid PDF detected");

    // Convert to base64
    const base64 = btoa(
      Array.from(uint8Array)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );

    console.log("Converted to base64, length:", base64.length);

    // Call OpenAI API with GPT-4.1 (upgraded from GPT-4o)
    console.log("Calling OpenAI GPT-4.1 Vision API...");
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        max_completion_tokens: 4000,
        messages: [
          {
            role: "system",
            content: `Extract ALL transactions from this bank statement PDF.
Return valid JSON array ONLY:
[{"date":"YYYY-MM-DD","description":"text","amount":number,"category":"Shopping|Transport|Food|Bills|Entertainment|Healthcare|Other","payee":"name","confidence":0.0-1.0}]

Rules:
- Negative = expenses, Positive = income
- Always include confidence score (0.5 = uncertain, 0.9 = certain)
- If unclear, use confidence: 0.5
- NO markdown, NO code blocks`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all transactions from this bank statement PDF. Return ONLY the JSON array."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
      signal: controller.signal
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");
    
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("Content preview:", content.substring(0, 200));

    // Parse the JSON response
    let transactions = [];
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
        console.log("Parsed transactions from JSON match:", transactions.length);
      } else {
        transactions = JSON.parse(content);
        console.log("Parsed transactions directly:", transactions.length);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      console.error("Content preview:", content.substring(0, 500));
      transactions = [];
    }

    console.log("Processing complete, returning", transactions.length, "transactions");

    return new Response(
      JSON.stringify({ transactions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Processing failed:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // Check if it's an AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          error: "Il file è troppo grande o la richiesta ha impiegato troppo tempo. Prova con un file più piccolo." 
        }),
        {
          status: 408,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process bank statement. Please try again or contact support if the issue persists." 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
});
