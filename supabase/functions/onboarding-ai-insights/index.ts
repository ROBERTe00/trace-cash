import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OnboardingData {
  savingsGoal: number;
  monthlyIncome: number;
  liquidity: number;
  assets: number;
  debts: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let step = 'unknown';

  try {
    const requestBody = await req.json();
    const { data } = requestBody;
    step = requestBody.step || 'unknown';
    console.log('📊 [Onboarding AI] Generating insights for step:', step);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemPrompt = "You are a financial advisor helping users understand their financial situation.";
    let userPrompt = "";

    if (step === "summary") {
      const netWorth = data.liquidity + data.assets - data.debts;
      const savingsRate = data.monthlyIncome > 0 
        ? ((data.monthlyIncome - 0) / data.monthlyIncome * 100).toFixed(1)
        : "0";

      systemPrompt = `You are a financial advisor. Provide concise, realistic financial projections in JSON format.
Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "oneYear": "Brief projection for 1 year (max 30 words)",
  "threeYear": "Brief projection for 3 years (max 30 words)", 
  "tips": ["Tip 1 (max 20 words)", "Tip 2 (max 20 words)", "Tip 3 (max 20 words)"]
}`;

      userPrompt = `User financial data:
- Monthly Income: €${data.monthlyIncome}
- Liquidity: €${data.liquidity}
- Total Assets: €${data.assets}
- Total Debts: €${data.debts}
- Net Worth: €${netWorth}
- Savings Goal: €${data.savingsGoal}
- Current Savings Rate: ${savingsRate}%

Generate realistic 1-year and 3-year projections, plus 3 actionable tips. Return ONLY the JSON object.`;
    } else {
      userPrompt = `Provide a brief financial insight based on: ${JSON.stringify(data)}`;
    }

    console.log('🤖 [Onboarding AI] Calling Lovable AI (Gemini 2.5 Flash)...');
    const startTime = Date.now();

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const latency = Date.now() - startTime;

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ [Onboarding AI] Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your Lovable workspace.');
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('✅ [Onboarding AI] AI response received:', { latency, choices: aiData.choices?.length });

    let insight = aiData.choices?.[0]?.message?.content || "Unable to generate insights at this time.";

    // Parse JSON for summary step
    if (step === "summary") {
      try {
        // Clean markdown code blocks if present
        let cleanedInsight = insight.trim();
        if (cleanedInsight.startsWith('```json')) {
          cleanedInsight = cleanedInsight.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } else if (cleanedInsight.startsWith('```')) {
          cleanedInsight = cleanedInsight.replace(/```\n?/g, '').trim();
        }
        
        insight = JSON.parse(cleanedInsight);
        console.log('✅ [Onboarding AI] JSON parsed successfully');
      } catch (parseError) {
        console.error('❌ [Onboarding AI] JSON parse error:', parseError);
        console.error('Raw content:', insight);
        
        // Fallback response
        insight = {
          oneYear: "Continue building emergency fund and reducing debt for improved financial stability.",
          threeYear: "Potential to increase savings and begin investing for long-term wealth building.",
          tips: [
            "Track all expenses to identify savings opportunities",
            "Build 3-6 months emergency fund before investing",
            "Consider automating savings from each paycheck"
          ]
        };
      }
    }

    // Log to ai_audit_logs
    try {
      const { data: { user } } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.replace('Bearer ', '') || ''
      );

      if (user) {
        await supabase.from('ai_audit_logs').insert({
          user_id: user.id,
          feature: 'onboarding-insights',
          ai_model: 'google/gemini-2.5-flash',
          input_prompt: userPrompt,
          ai_raw_response: typeof insight === 'string' ? insight : JSON.stringify(insight),
          latency_ms: latency,
          success: true,
          ui_summary: `Onboarding step: ${step}`,
        });
      }
    } catch (logError) {
      console.error('⚠️ [Onboarding AI] Failed to log to audit:', logError);
    }

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [Onboarding AI] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        insight: step === 'summary' ? {
          oneYear: "Unable to generate projection at this time.",
          threeYear: "Please try again later.",
          tips: ["Focus on tracking your expenses", "Build an emergency fund", "Review your financial goals regularly"]
        } : "Unable to generate insights. Please try again."
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
