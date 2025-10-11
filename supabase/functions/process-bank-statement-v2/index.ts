import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const uploadSchema = z.object({
  fileUrl: z.string().url().startsWith('https://bexsbrlwjelfgmcvnmrf.supabase.co/storage/'),
  fileName: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+\.pdf$/i)
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes for large PDFs

  try {
    const body = await req.json();
    
    // Validate input
    const validation = uploadSchema.safeParse(body);
    if (!validation.success) {
      console.error("Invalid input:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid file URL or filename",
          details: validation.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { fileUrl, fileName } = validation.data;
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

    // Enhanced PDF text extraction
    console.log("Extracting text from PDF...");
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    let extractedText = "";
    
    try {
      // Convert buffer to string
      const pdfContent = textDecoder.decode(uint8Array);
      
      // Method 1: Extract from BT/ET blocks (Begin Text / End Text)
      const btEtMatches = pdfContent.matchAll(/BT\s+(.*?)\s+ET/gs);
      for (const match of btEtMatches) {
        const textBlock = match[1];
        
        // Extract from Tj operators: (text)Tj
        const tjMatches = textBlock.matchAll(/\((.*?)\)\s*Tj/g);
        for (const tj of tjMatches) {
          const text = tj[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          extractedText += text + " ";
        }
        
        // Extract from TJ operators: [(text)]TJ
        const tjArrayMatches = textBlock.matchAll(/\[\s*(.*?)\s*\]\s*TJ/g);
        for (const tjArray of tjArrayMatches) {
          const arrayContent = tjArray[1];
          const textMatches = arrayContent.matchAll(/\((.*?)\)/g);
          for (const tm of textMatches) {
            extractedText += tm[1] + " ";
          }
        }
      }
      
      // Method 2: Extract all text in parentheses (fallback for different PDF structures)
      if (extractedText.length < 100) {
        console.log("Using fallback extraction method...");
        const allTextMatches = pdfContent.matchAll(/\(([^)]{3,}?)\)/g);
        for (const match of allTextMatches) {
          extractedText += match[1] + " ";
        }
      }
      
      // Method 3: Look for specific patterns (dates, amounts)
      // This helps capture tabular data that might be missed
      const datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/g;
      const amountPattern = /\b(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\b/g;
      
      const dates = Array.from(pdfContent.matchAll(datePattern), m => m[1]);
      const amounts = Array.from(pdfContent.matchAll(amountPattern), m => m[1]);
      
      console.log(`Found ${dates.length} potential dates and ${amounts.length} potential amounts in raw PDF`);
      
      // Normalize extracted text
      extractedText = extractedText
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log("Extracted text length:", extractedText.length);
      console.log("First 500 chars:", extractedText.substring(0, 500));
      
      if (extractedText.length < 50) {
        throw new Error("Could not extract sufficient text from PDF. The PDF might be scanned or image-based.");
      }
    } catch (parseError) {
      console.error("PDF parsing error:", parseError);
      throw new Error("Failed to parse PDF content. Please ensure the PDF contains readable text.");
    }

    // First AI call: Detect bank name
    console.log("Step 1: Detecting bank name...");
    const bankDetectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a bank statement analyzer. Identify the bank name from the statement text.
Return ONLY the bank name, nothing else. Common banks: Intesa Sanpaolo, UniCredit, Banco BPM, BNL, Poste Italiane, ING, Fineco, etc.
If you can't identify the bank, return "Unknown Bank".`
          },
          {
            role: "user",
            content: `Identify the bank from this statement:\n\n${extractedText.substring(0, 2000)}`
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    let bankName = "Unknown Bank";
    if (bankDetectionResponse.ok) {
      const bankData = await bankDetectionResponse.json();
      bankName = (bankData.choices?.[0]?.message?.content || "Unknown Bank").trim();
      console.log("Detected bank:", bankName);
    }

    // Second AI call: Extract ALL transactions with categorization
    console.log("Step 2: Extracting and categorizing all transactions...");
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
            content: `You are an expert financial transaction extractor and categorizer. Your job is to extract EVERY SINGLE transaction from bank statements with high accuracy.

CRITICAL RULES:
1. Extract ALL transactions - even if there are 50+ transactions
2. Return ONLY valid JSON, no markdown, no code blocks, no explanations
3. NEGATIVE amounts (-) for expenses/debits/outgoing payments
4. POSITIVE amounts (+) for income/credits/deposits
5. Normalize dates to YYYY-MM-DD format (use 2024 if year is missing)
6. Add confidence score (0.0-1.0) for each categorization
7. Low confidence (<0.6) = unclear merchant/description

CATEGORIES (use EXACTLY these):
- "Food & Dining" (restaurants, groceries, food delivery)
- "Transportation" (fuel, parking, public transport, car maintenance)
- "Shopping" (clothing, electronics, general retail)
- "Entertainment" (movies, games, streaming, hobbies)
- "Healthcare" (pharmacy, doctors, medical)
- "Bills & Utilities" (rent, electricity, water, gas, internet, phone)
- "Income" (salary, refunds, transfers in)
- "Other" (ATM, transfers, unclear items)

OUTPUT FORMAT (pure JSON array):
[
  {
    "date": "YYYY-MM-DD",
    "description": "clean description",
    "amount": -45.99 or +1000.00,
    "category": "exact category from list",
    "payee": "merchant/payee name",
    "confidence": 0.85
  }
]

EXAMPLES:
"15/03 ESSELUNGA -32.50" → {"date":"2024-03-15","description":"ESSELUNGA","amount":-32.50,"category":"Food & Dining","payee":"Esselunga","confidence":0.95}
"20/03 ATM PRELIEVO -100.00" → {"date":"2024-03-20","description":"ATM PRELIEVO","amount":-100.00,"category":"Other","payee":"ATM","confidence":1.0}
"25/03 STIPENDIO +2500.00" → {"date":"2024-03-25","description":"STIPENDIO","amount":2500.00,"category":"Income","payee":"Employer","confidence":1.0}

IGNORE: Opening/closing balances, summary rows, page headers/footers, non-transaction text.

EXTRACT ALL TRANSACTIONS - DO NOT STOP AT 10 OR 20!`
          },
          {
            role: "user",
            content: `Bank: ${bankName}\n\nExtract ALL transactions from this statement:\n\n${extractedText}`
          }
        ],
        max_tokens: 32000,
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
    console.log("AI response length:", content.length);
    console.log("AI response preview:", content.substring(0, 500));

    let transactions = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
      } else {
        // Try direct parse
        transactions = JSON.parse(content);
      }
      
      // Validate and clean transactions
      transactions = transactions.filter((t: any) => {
        return t.date && t.description && typeof t.amount === 'number' && t.category;
      }).map((t: any) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        payee: t.payee || "Unknown",
        bank: bankName,
        // Ensure confidence is between 0 and 1
        confidence: Math.max(0, Math.min(1, t.confidence || 0.5))
      }));
      
      console.log(`Successfully extracted ${transactions.length} valid transactions`);
      
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      console.error("Raw response:", content);
      
      // Try one more time with error recovery
      try {
        // Remove any markdown code block markers
        const cleaned = content
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        transactions = JSON.parse(cleaned);
        console.log("Recovered transactions after cleaning:", transactions.length);
      } catch (e2) {
        console.error("Recovery failed:", e2);
        transactions = [];
      }
    }

    if (transactions.length === 0) {
      console.warn("No transactions extracted from AI response");
      return new Response(
        JSON.stringify({ 
          error: "Could not extract transactions from the PDF. Please ensure the PDF contains a readable transaction table.",
          bank: bankName,
          transactions: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing complete: ${transactions.length} transactions from ${bankName}`);

    return new Response(
      JSON.stringify({ 
        bank: bankName,
        transactions,
        totalExtracted: transactions.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Processing failed:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          error: "The file is too large or processing took too long. Please try with a smaller file or fewer pages." 
        }),
        { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to process bank statement. Please try again.",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    clearTimeout(timeoutId);
  }
});