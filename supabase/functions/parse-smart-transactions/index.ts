import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  confidence?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileType, userId } = await req.json();
    
    if (!fileContent || !userId) {
      throw new Error("Missing required parameters");
    }

    // Parse based on file type
    let transactions: Transaction[] = [];
    
    if (fileType === "csv" || fileType === "excel") {
      const lines = fileContent.split("\n").filter((line: string) => line.trim());
      
      if (lines.length < 2) {
        throw new Error("File vuoto o formato non valido");
      }

      const headers = lines[0].toLowerCase().split(/[,;]/);
      
      // Find column indices
      const dateIdx = headers.findIndex((h: string) => 
        h.includes("date") || h.includes("data") || h.includes("valuta")
      );
      const descIdx = headers.findIndex((h: string) => 
        h.includes("desc") || h.includes("causale") || h.includes("dettagli") || h.includes("beneficiario")
      );
      const amountIdx = headers.findIndex((h: string) => 
        h.includes("amount") || h.includes("importo") || h.includes("dare") || h.includes("avere")
      );

      if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
        throw new Error("Colonne richieste non trovate. Assicurati che il file contenga: Data, Descrizione, Importo");
      }

      // Parse transactions
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;]/);
        
        if (cols.length > Math.max(dateIdx, descIdx, amountIdx)) {
          const dateStr = cols[dateIdx]?.trim();
          const description = cols[descIdx]?.trim();
          const amountStr = cols[amountIdx]?.replace(/[^0-9.,-]/g, "").replace(",", ".");
          
          if (dateStr && description && amountStr) {
            // Parse date (support multiple formats)
            let parsedDate = dateStr;
            if (dateStr.includes("/")) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                // Convert DD/MM/YYYY to YYYY-MM-DD
                parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }

            const amount = parseFloat(amountStr);
            if (!isNaN(amount)) {
              transactions.push({
                date: parsedDate,
                description: description,
                amount: amount,
              });
            }
          }
        }
      }
    }

    if (transactions.length === 0) {
      throw new Error("Nessuna transazione valida trovata nel file");
    }

    // AI Categorization with OpenAI
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    console.log(`Processing ${transactions.length} transactions with AI...`);

    // Categorize in batches for efficiency
    const categorizedTransactions = [];
    
    for (const txn of transactions) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "Sei un AI che categorizza transazioni finanziarie in italiano. Rispondi SOLO con UNA delle seguenti categorie esatte: Food, Transport, Entertainment, Shopping, Bills, Healthcare, Education, Income, Investment, Other. Non aggiungere spiegazioni."
              },
              {
                role: "user",
                content: `Categorizza questa transazione italiana:\nDescrizione: "${txn.description}"\nImporto: €${txn.amount}`
              }
            ],
          }),
        });

        if (!response.ok) {
          console.error(`AI categorization failed for "${txn.description}"`);
          txn.category = "Other";
          txn.confidence = 0.5;
        } else {
          const data = await response.json();
          const category = data.choices?.[0]?.message?.content?.trim() || "Other";
          
          // Validate category
          const validCategories = ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Healthcare", "Education", "Income", "Investment", "Other"];
          txn.category = validCategories.includes(category) ? category : "Other";
          txn.confidence = 0.85;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error categorizing transaction: ${errorMessage}`);
        txn.category = "Other";
        txn.confidence = 0.5;
      }

      categorizedTransactions.push(txn);
    }

    // Store in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const expensesToInsert = categorizedTransactions.map(t => ({
      user_id: userId,
      date: t.date,
      description: t.description,
      amount: Math.abs(t.amount),
      category: t.category,
      type: t.amount < 0 ? "Expense" : "Income",
      recurring: false,
    }));

    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert(expensesToInsert)
      .select();

    if (error) {
      console.error("Database insert error:", error);
      throw new Error(`Errore database: ${error.message}`);
    }

    console.log(`Successfully inserted ${inserted.length} transactions`);

    return new Response(
      JSON.stringify({
        success: true,
        transactions: inserted,
        message: `✅ ${inserted.length} transazioni importate e categorizzate con AI`,
        stats: {
          total: inserted.length,
          expenses: inserted.filter(t => t.type === "Expense").length,
          income: inserted.filter(t => t.type === "Income").length,
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Errore durante l'elaborazione del file";
    console.error("Error in parse-smart-transactions:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
