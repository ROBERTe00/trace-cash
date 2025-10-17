import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const financialDataSchema = z.object({
  financialData: z.object({
    totalExpenses: z.number().min(0).max(100000000).optional(),
    totalIncome: z.number().min(0).max(100000000).optional(),
    portfolioValue: z.number().min(0).max(100000000).optional(),
    categoryBreakdown: z.record(z.string().max(50), z.number().min(0).max(1000000)).optional(),
    expenseCount: z.number().int().min(0).max(10000).optional(),
    investmentCount: z.number().int().min(0).max(1000).optional(),
    goalsProgress: z.array(z.any()).max(100).optional()
  })
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validation = financialDataSchema.safeParse(body);
    if (!validation.success) {
      console.error("Invalid input:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid financial data format",
          details: validation.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { financialData } = validation.data;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
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

    // DETERMINISTIC PRE-CHECK: Crypto exposure risk
    const messages: Array<{ role: string; content: string }> = [];
    
    // Calculate crypto exposure from categoryBreakdown
    const portfolioEntries = Object.entries(categoryBreakdown);
    const totalPortfolio = portfolioEntries.reduce((sum, [_, val]) => sum + val, 0);
    const cryptoValue = portfolioEntries
      .filter(([key]) => /btc|eth|crypto|bitcoin|ethereum/i.test(key))
      .reduce((sum, [_, val]) => sum + val, 0);
    const cryptoPerc = totalPortfolio === 0 ? 0 : Math.round((cryptoValue / totalPortfolio) * 100);

    if (cryptoPerc >= 50) {
      messages.push({
        role: "system",
        content: `DETERMINISTIC RULE: User's crypto exposure is ${cryptoPerc}%. This MUST be classified as HIGH RISK. You must advise portfolio diversification and warn about volatility.`
      });
    }

    messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: "Generate 3 financial advice cards for me" });

    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.2,
        max_tokens: 1000,
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
          JSON.stringify({ error: "OpenAI credits exhausted. Please check your OpenAI account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid OpenAI API key. Please check your configuration." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const advice = data.choices[0].message.content;
    const latency = Date.now() - startTime;

    // Log to ai_audit_logs
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.from('ai_audit_logs').insert({
          user_id: user.id,
          feature: 'financial_advice',
          ai_model: 'gpt-4o',
          temperature: 0.2,
          input_prompt: systemPrompt,
          ai_raw_response: advice,
          ui_summary: advice,
          latency_ms: latency,
          success: true
        });
      }
    } catch (logError) {
      console.error('Failed to log AI audit:', logError);
    }

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
