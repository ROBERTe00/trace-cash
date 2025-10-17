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

    // Enhanced PDF text extraction with MULTI-PAGE SUPPORT
    console.log("Extracting text from PDF with multi-page detection...");
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    let extractedText = "";
    let pageCount = 1;
    
    try {
      // Convert buffer to string
      const pdfContent = textDecoder.decode(uint8Array);
      
      // STEP 1: Detect number of pages
      // Method A: Look for /Count in /Pages object
      const pagesCountMatch = pdfContent.match(/\/Type\s*\/Pages[^]*?\/Count\s+(\d+)/i);
      if (pagesCountMatch) {
        pageCount = parseInt(pagesCountMatch[1], 10);
        console.log(`PDF has ${pageCount} pages (detected from /Count)`);
      } else {
        // Method B: Count /Page objects (not /Pages)
        const pageMatches = pdfContent.match(/\/Type\s*\/Page(?!\s*s)/gi);
        if (pageMatches) {
          pageCount = pageMatches.length;
          console.log(`PDF has ${pageCount} pages (detected from /Page objects)`);
        }
      }
      
      // STEP 2: Split content by page markers for better extraction
      const pageTexts: string[] = [];
      
      // Try to split by page boundaries
      const pageSplitPattern = /\/Type\s*\/Page(?!\s*s)[^]*?(?=\/Type\s*\/Page(?!\s*s)|$)/gi;
      const pageMatches = Array.from(pdfContent.matchAll(pageSplitPattern));
      
      if (pageMatches.length > 0) {
        console.log(`Splitting into ${pageMatches.length} page sections`);
        for (let i = 0; i < pageMatches.length; i++) {
          const pageContent = pageMatches[i][0];
          const pageText = extractTextFromPageContent(pageContent);
          if (pageText.length > 50) {
            pageTexts.push(pageText);
            console.log(`Page ${i + 1} text length: ${pageText.length}`);
          }
        }
      }
      
      // If page splitting didn't work well, extract all at once
      if (pageTexts.length === 0) {
        console.log("Page splitting unsuccessful, using full document extraction");
        const fullText = extractTextFromPageContent(pdfContent);
        pageTexts.push(fullText);
      }
      
      // Combine all pages with page markers
      extractedText = pageTexts
        .map((text, idx) => `\n=== PAGE ${idx + 1} OF ${pageTexts.length} ===\n${text}`)
        .join('\n\n');
      
      console.log(`Total extracted text length: ${extractedText.length} chars from ${pageTexts.length} page(s)`);
      console.log("First 500 chars:", extractedText.substring(0, 500));
      
      // Check if extraction failed (corrupted text or insufficient length)
      const hasCorruptedChars = /[\x00-\x1F\x7F-\xFF]{10,}/.test(extractedText);
      const insufficientText = extractedText.length < 1000;
      const totalChars = extractedText.length;
      const nonAsciiCount = extractedText.split('').filter(c => c.charCodeAt(0) > 127).length;
      const hasGarbage = totalChars > 0 && (nonAsciiCount / totalChars) > 0.3;

      if (hasCorruptedChars || insufficientText || hasGarbage) {
        console.log("⚠️ Native text extraction failed - corrupted chars:", hasCorruptedChars, "insufficient:", insufficientText, "garbage:", hasGarbage);
        console.log("🔍 Switching to Vision API fallback...");
        return await processWithVision(uint8Array, fileName, LOVABLE_API_KEY);
      }
      
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
      }),
      signal: controller.signal
    });

    let bankName = "Unknown Bank";
    if (bankDetectionResponse.ok) {
      const bankData = await bankDetectionResponse.json();
      bankName = (bankData.choices?.[0]?.message?.content || "Unknown Bank").trim();
      console.log("Detected bank:", bankName);
    }

    // Second AI call: Extract ALL transactions with categorization + merchant lookup
    console.log("Step 2: Extracting and categorizing all transactions...");
    
    // Enhanced extraction with merchant context
    const merchantHints = extractMerchantHints(extractedText);
    
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
1. **EXTRACT ALL TRANSACTIONS** - Process EVERY PAGE! If you see "PAGE X OF Y" markers, extract from ALL pages
2. Return ONLY valid JSON, no markdown, no code blocks, no explanations
3. NEGATIVE amounts (-) for expenses/debits/outgoing payments
4. POSITIVE amounts (+) for income/credits/deposits
5. Normalize dates to YYYY-MM-DD format (use 2024 if year is missing)
6. Add confidence score (0.0-1.0) for each categorization
7. Low confidence (<0.6) = unclear merchant/description

MULTI-PAGE HANDLING:
- The statement may contain multiple pages marked as "=== PAGE X OF Y ==="
- DO NOT STOP after the first page
- Continue extracting until you reach the end of ALL pages
- Typical statements have 30-50 transactions across 2-3 pages

MERCHANT IDENTIFICATION:
- Look for known brands (Esselunga, McDonald's, Netflix, etc.)
- Identify by context (POS, ATM, CARD, PAYMENT keywords)
- For unclear items, mark confidence as low (<0.6)

CATEGORIES (use EXACTLY these):
- "Food & Dining" (restaurants, groceries, food delivery, supermarkets, bars, cafés)
- "Transportation" (fuel, parking, public transport, car maintenance, taxi, ride services)
- "Shopping" (clothing, electronics, general retail, online shopping)
- "Entertainment" (movies, games, streaming, hobbies, subscriptions)
- "Healthcare" (pharmacy, doctors, medical, hospitals)
- "Bills & Utilities" (rent, electricity, water, gas, internet, phone, insurance)
- "Income" (salary, refunds, transfers in, deposits)
- "Other" (ATM, transfers, unclear items, fees)

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
"15/03 ESSELUNGA MILANO -32.50" → {"date":"2024-03-15","description":"ESSELUNGA MILANO","amount":-32.50,"category":"Food & Dining","payee":"Esselunga","confidence":0.95}
"20/03 ATM PRELIEVO VIA ROMA -100.00" → {"date":"2024-03-20","description":"ATM PRELIEVO VIA ROMA","amount":-100.00,"category":"Other","payee":"ATM","confidence":1.0}
"25/03 STIPENDIO ACCREDITO +2500.00" → {"date":"2024-03-25","description":"STIPENDIO ACCREDITO","amount":2500.00,"category":"Income","payee":"Employer","confidence":1.0}

IGNORE: Opening/closing balances, summary rows, page headers/footers, non-transaction text, totals.

**CRITICAL**: If you see 30 transactions across 3 pages, extract ALL 30! Don't stop at 10 or 20!`
          },
          {
            role: "user",
            content: `Bank: ${bankName}

Merchant hints found: ${merchantHints.length > 0 ? merchantHints.join(', ') : 'None'}

Extract ALL transactions from this statement:
TOTAL PAGES: This statement has ${extractedText.split('=== PAGE').length - 1} pages.
YOU MUST extract transactions from ALL pages, not just the first one!

${extractedText}`
          }
        ],
      }),
      signal: controller.signal
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("⏱️ Too many requests. Please wait 1 minute and retry.");
      }
      if (aiResponse.status === 402) {
        throw new Error("💳 AI credits exhausted. Please top up your workspace credits.");
      }
      if (aiResponse.status === 401) {
        throw new Error("🔑 Invalid AI API key. Contact support.");
      }
      
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response length:", content.length);
    console.log("AI response preview:", content.substring(0, 500));

    let transactions = [];
    try {
      // Extract JSON from GPT-4o response (handles markdown wrappers)
      // Step 1: Strip ALL markdown code fences
      let cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      
      // Step 2: Extract JSON array with multiple patterns
      const patterns = [
        /\[[\s\S]*\]/,  // Standard array
        /\{[\s\S]*"transactions"[\s\S]*\}/,  // Wrapped in object
      ];
      
      for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            transactions = Array.isArray(parsed) ? parsed : parsed.transactions || [];
            if (transactions.length > 0) break;
          } catch (e) { 
            continue; 
          }
        }
      }
      
      if (transactions.length === 0) {
        console.error("❌ No transactions found. Raw GPT-4o response:");
        console.error(content.substring(0, 1000));
        throw new Error("Failed to extract transactions from AI response");
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
      console.error("JSON parsing failed:", e);
      throw new Error("Invalid AI response format");
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
        totalExtracted: transactions.length,
        method: "text"
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

/**
 * Extract text from a PDF page content section
 * Handles multiple text encoding methods
 */
function extractTextFromPageContent(content: string): string {
  let text = "";
  
  // Method 1: Extract from BT/ET blocks (Begin Text / End Text)
  const btEtMatches = content.matchAll(/BT\s+(.*?)\s+ET/gs);
  for (const match of btEtMatches) {
    const textBlock = match[1];
    
    // Extract from Tj operators: (text)Tj
    const tjMatches = textBlock.matchAll(/\((.*?)\)\s*Tj/g);
    for (const tj of tjMatches) {
      const decoded = tj[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      text += decoded + " ";
    }
    
    // Extract from TJ operators: [(text)]TJ
    const tjArrayMatches = textBlock.matchAll(/\[\s*(.*?)\s*\]\s*TJ/g);
    for (const tjArray of tjArrayMatches) {
      const arrayContent = tjArray[1];
      const textMatches = arrayContent.matchAll(/\((.*?)\)/g);
      for (const tm of textMatches) {
        text += tm[1] + " ";
      }
    }
  }
  
  // Method 2: Extract all text in parentheses (fallback)
  if (text.length < 100) {
    const allTextMatches = content.matchAll(/\(([^)]{3,}?)\)/g);
    for (const match of allTextMatches) {
      text += match[1] + " ";
    }
  }
  
  // Normalize
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract potential merchant hints from text
 * Helps improve categorization accuracy
 */
function extractMerchantHints(text: string): string[] {
  const hints: Set<string> = new Set();
  const commonMerchants = [
    'esselunga', 'coop', 'conad', 'carrefour',
    'eni', 'agip', 'shell', 'q8',
    'mcdonald', 'burger king', 'kfc',
    'amazon', 'ebay', 'zalando',
    'netflix', 'spotify', 'disney',
    'farmacia', 'pharmacy',
    'enel', 'tim', 'vodafone', 'wind',
  ];
  
  const lowerText = text.toLowerCase();
  for (const merchant of commonMerchants) {
    if (lowerText.includes(merchant)) {
      hints.add(merchant);
    }
  }
  
  return Array.from(hints);
}

async function processWithVision(
  pdfContent: Uint8Array,
  fileName: string,
  lovableApiKey: string
): Promise<Response> {
  console.log("🔍 Processing with Lovable AI Vision...");

  try {
    // Convert PDF to base64
    const base64Pdf = btoa(String.fromCharCode(...pdfContent));

    // Step 1: Detect bank name with Vision
    console.log("Step 1: Detecting bank name with Vision API...");
    const bankDetectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a bank statement analyzer. Identify the bank name from the visual statement. Return ONLY the bank name, nothing else."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "What is the name of the bank in this statement?" },
              { 
                type: "image_url", 
                image_url: { url: `data:application/pdf;base64,${base64Pdf}` } 
              }
            ]
          }
        ]
      })
    });

    let bankName = "Unknown Bank";
    if (bankDetectionResponse.ok) {
      const bankData = await bankDetectionResponse.json();
      bankName = (bankData.choices?.[0]?.message?.content || "Unknown Bank").trim();
      console.log("Detected bank:", bankName);
    }

    // Step 2: Extract transactions with Vision
    console.log("Step 2: Extracting transactions with Vision API...");
    const transactionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting transactions from bank statements using visual analysis.

CRITICAL RULES:
1. Extract ALL transactions from ALL pages of the PDF
2. Return ONLY a pure JSON array, no markdown, no explanations
3. Negative amounts (-) for expenses/debits, positive (+) for income/credits
4. Date format: YYYY-MM-DD (normalize Italian dates like 28/08/2025 to 2025-08-28)
5. Add confidence score (0.0-1.0) based on clarity of the data
6. Extract merchant/payee name and transaction description

CATEGORIES (choose most appropriate):
- "Food & Dining"
- "Transportation"
- "Shopping"
- "Entertainment"
- "Healthcare"
- "Bills & Utilities"
- "Income"
- "Investments"
- "Other"

OUTPUT FORMAT (pure JSON array only):
[{"date":"YYYY-MM-DD","description":"transaction description","amount":-99.99,"category":"category","payee":"merchant name","confidence":0.85}]

Extract EVERY transaction you can see across ALL pages.`
          },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Extract ALL transactions from this ${bankName} bank statement. Process every page and return a complete JSON array of all transactions.` 
              },
              { 
                type: "image_url", 
                image_url: { url: `data:application/pdf;base64,${base64Pdf}` } 
              }
            ]
          }
        ]
      })
    });

    if (!transactionResponse.ok) {
      const errorText = await transactionResponse.text();
      console.error("Vision API error:", transactionResponse.status, errorText);
      throw new Error(`Vision API failed: ${transactionResponse.status}`);
    }

    const transactionData = await transactionResponse.json();
    const content = transactionData.choices?.[0]?.message?.content || "";
    
    console.log("Vision API response length:", content.length);
    console.log("Vision API response preview:", content.substring(0, 500));

    // Parse JSON response
    let transactions = [];
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      
      // Extract JSON array
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
      } else {
        console.error("No JSON array found in response:", cleaned.substring(0, 200));
        throw new Error("Failed to extract JSON array from vision response");
      }
    } catch (e) {
      console.error("Vision response parsing failed:", e);
      console.error("Raw content:", content);
      throw new Error("Failed to parse vision response");
    }

    // Validate and clean transactions
    const validTransactions = transactions.filter((t: any) => 
      t.date && t.description && typeof t.amount === 'number' && t.category
    ).map((t: any) => ({
      date: t.date,
      description: t.description || "Unknown",
      amount: t.amount,
      category: t.category || "Other",
      payee: t.payee || t.description,
      confidence: Math.max(0, Math.min(1, t.confidence || 0.7)),
      bank: bankName,
      extractionMethod: "vision"
    }));

    console.log(`✅ Vision extraction complete: ${validTransactions.length} transactions`);

    if (validTransactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No transactions extracted via Vision API",
          bank: bankName,
          transactions: [],
          method: "vision"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        bank: bankName,
        transactions: validTransactions,
        totalExtracted: validTransactions.length,
        method: "vision"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Vision processing error:", error);
    throw error;
  }
}