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
    const { expenses, investments, goals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate totals
    const totalExpenses = expenses.filter((e: any) => e.type === "Expense")
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    const totalIncome = expenses.filter((e: any) => e.type === "Income")
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    const portfolioValue = investments.reduce((sum: any, inv: any) => 
      sum + (inv.quantity * inv.currentPrice), 0);

    const systemPrompt = `You are a professional financial advisor. Analyze the user's financial data and provide 3 personalized, actionable advice cards. Keep each advice concise (max 2 sentences) and practical.

User's Financial Data:
- Monthly Income: €${totalIncome}
- Monthly Expenses: €${totalExpenses}
- Savings Rate: ${((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)}%
- Portfolio Value: €${portfolioValue}
- Active Goals: ${goals.length}

Focus on:
1. Budget optimization
2. Investment strategy
3. Goal achievement`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate 3 financial advice cards for me" },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const advice = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ advice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-financial-advice:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
