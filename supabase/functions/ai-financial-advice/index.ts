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
    const { financialData } = await req.json();

    // Input validation
    if (!financialData || typeof financialData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid financial data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate numeric fields
    const numericFields = ['totalExpenses', 'totalIncome', 'portfolioValue', 'expenseCount', 'investmentCount'];
    for (const field of numericFields) {
      if (financialData[field] !== undefined && 
          (typeof financialData[field] !== 'number' || 
           financialData[field] < 0 || 
           financialData[field] > 100000000)) {
        return new Response(
          JSON.stringify({ error: 'Invalid financial data values' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sanitize category breakdown
    const validCategories = [
      'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
      'Healthcare', 'Bills & Utilities', 'Income', 'Other', 
      'Salary', 'Food', 'Transport', 'Rent'
    ];
    
    if (financialData.categoryBreakdown && typeof financialData.categoryBreakdown === 'object') {
      const sanitizedBreakdown: Record<string, number> = {};
      for (const [category, amount] of Object.entries(financialData.categoryBreakdown)) {
        // Only allow predefined categories with string names under 50 chars
        if (typeof category === 'string' && 
            category.length <= 50 && 
            typeof amount === 'number' && 
            amount >= 0 && 
            amount <= 1000000) {
          // Limit to valid categories or truncate custom ones
          const safeCategory = validCategories.includes(category) 
            ? category 
            : category.substring(0, 50);
          sanitizedBreakdown[safeCategory] = amount;
        }
      }
      financialData.categoryBreakdown = sanitizedBreakdown;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const {
      totalExpenses = 0,
      totalIncome = 0,
      portfolioValue = 0,
      categoryBreakdown = {},
      expenseCount = 0,
      investmentCount = 0,
      goalsProgress = []
    } = financialData;

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : "0";
    
    const topCategories = Object.entries(categoryBreakdown)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amount]) => `${cat}: €${amount}`)
      .join(", ");

    const systemPrompt = `You are a professional financial advisor. Analyze the user's financial data and provide 3 personalized, actionable advice cards. Keep each advice concise (max 2 sentences) and practical.

User's Financial Data:
- Monthly Income: €${totalIncome.toFixed(2)}
- Monthly Expenses: €${totalExpenses.toFixed(2)}
- Savings Rate: ${savingsRate}%
- Portfolio Value: €${portfolioValue.toFixed(2)}
- Active Goals: ${goalsProgress.length}
- Top Spending: ${topCategories || "N/A"}

Focus on:
1. Budget optimization based on spending patterns
2. Investment diversification strategy
3. Goal achievement acceleration tips`;

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
    console.error('Error in generate-ai-advice function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unable to generate financial advice at this time. Please try again later.' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
