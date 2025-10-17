import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { executeAIRequest } from '../_shared/aiRequestBuilder.ts';

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

    // Calculate portfolio data for rule engine
    const portfolioEntries = Object.entries(categoryBreakdown);
    const totalPortfolio = portfolioEntries.reduce((sum, [_, val]) => sum + val, 0);
    const cryptoValue = portfolioEntries
      .filter(([key]) => /btc|eth|crypto|bitcoin|ethereum/i.test(key))
      .reduce((sum, [_, val]) => sum + val, 0);
    const cryptoPerc = totalPortfolio === 0 ? 0 : Math.round((cryptoValue / totalPortfolio) * 100);

    const portfolioData = {
      crypto_allocation: cryptoPerc,
      bonds_allocation: 0,
      cash_balance: 0,
      equities_allocation: 100 - cryptoPerc,
      assets: portfolioEntries.map(([key, val]) => ({
        name: key,
        weight: totalPortfolio > 0 ? (val / totalPortfolio) * 100 : 0,
        value: val,
        type: key
      }))
    };

    // Execute AI request with rule engine
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const aiResponse = await executeAIRequest(
      portfolioData,
      {
        model: "gpt-4o",
        temperature: 0.15,
        maxTokens: 1000,
        systemPrompt,
        userPrompt: "Generate 3 financial advice cards for me"
      },
      OPENAI_API_KEY,
      supabase,
      user.id,
      'financial_advice'
    );

    return new Response(
      JSON.stringify({ advice: aiResponse.summary }),
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
