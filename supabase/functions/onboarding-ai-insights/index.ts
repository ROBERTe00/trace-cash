import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingData {
  savingsGoal: number;
  monthlyIncome: number;
  liquidity: number;
  assets: number;
  debts: number;
  step: "welcome" | "essentials" | "expenses" | "investments" | "summary";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, step }: { data: OnboardingData; step: string } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log(`Generating AI insights for ${step} step...`);

    // Build context-specific prompts
    let systemPrompt = "You are a professional financial advisor. Provide clear, actionable insights in 2-3 sentences.";
    let userPrompt = "";

    switch (step) {
      case "welcome":
        userPrompt = `User wants to save €${data.savingsGoal}/month with a monthly income of €${data.monthlyIncome}. 
        Calculate how many months it would take assuming a 20% savings rate. Provide an encouraging insight.`;
        break;

      case "essentials":
        const netWorth = data.liquidity + data.assets - data.debts;
        const debtToAssetRatio = data.assets > 0 ? (data.debts / data.assets) * 100 : 0;
        userPrompt = `User financial profile:
        - Monthly Income: €${data.monthlyIncome}
        - Liquidity: €${data.liquidity}
        - Total Assets: €${data.assets}
        - Total Debts: €${data.debts}
        - Net Worth: €${netWorth}
        - Debt-to-Asset Ratio: ${debtToAssetRatio.toFixed(1)}%
        
        Provide 3 key financial insights about their current situation and actionable advice.`;
        break;

      case "expenses":
        userPrompt = `User is about to upload expenses. Explain how AI categorization with GPT-4o will help them 
        understand spending patterns and identify top categories. Keep it brief and exciting.`;
        break;

      case "investments":
        userPrompt = `User is importing investments. Explain how live price tracking and portfolio analysis 
        with AI will help them optimize returns. Keep it brief and motivating.`;
        break;

      case "summary":
        const netWorthSummary = data.liquidity + data.assets - data.debts;
        const savingsRate = data.monthlyIncome > 0 ? (data.savingsGoal / data.monthlyIncome) * 100 : 0;
        userPrompt = `User complete profile:
        - Monthly Income: €${data.monthlyIncome}
        - Savings Goal: €${data.savingsGoal}
        - Net Worth: €${netWorthSummary}
        - Savings Rate: ${savingsRate.toFixed(0)}%
        
        Provide:
        1. 1-year projection (accumulation if savings goal met)
        2. 3-year projection (with 5% annual return on investments)
        3. One actionable tip to improve financial health
        
        Format as JSON:
        {
          "oneYear": "€X accumulated",
          "threeYear": "€X net worth",
          "tip": "Actionable advice"
        }`;
        break;

      default:
        throw new Error("Invalid step");
    }

    // Call OpenAI GPT-4o API
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "OpenAI credits exhausted. Please check your account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    console.log("AI insight generated successfully");

    // Parse JSON for summary step
    let insight = content;
    if (step === "summary") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          insight = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse JSON from AI response:", e);
      }
    }

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in onboarding-ai-insights:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
