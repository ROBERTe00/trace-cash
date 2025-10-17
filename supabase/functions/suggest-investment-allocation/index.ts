import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { executeAIRequest } from '../_shared/aiRequestBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { available_amount, time_horizon, risk_tolerance } = await req.json();

    console.log('Generating investment allocation for user:', user.id);

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch current investments for diversification context
    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id);

    const currentAllocation = investments?.reduce((acc: Record<string, number>, inv) => {
      const value = parseFloat(inv.current_price) * parseFloat(inv.quantity);
      acc[inv.type] = (acc[inv.type] || 0) + value;
      return acc;
    }, {}) || {};

    const totalPortfolio = Object.values(currentAllocation).reduce((sum: number, val) => sum + (val as number), 0);

    // Prepare AI prompt
    const prompt = `As a financial advisor, create an investment allocation strategy:

USER PROFILE:
- Main Goal: ${profile?.main_goal || 'Not specified'}
- Investment Interest: ${profile?.investment_interest || 'Not specified'}
- Available to Invest: $${available_amount || 0}
- Time Horizon: ${time_horizon || 'Medium-term (3-5 years)'}
- Risk Tolerance: ${risk_tolerance || 'Moderate'}

CURRENT PORTFOLIO VALUE: $${totalPortfolio.toFixed(2)}
CURRENT ALLOCATION: ${Object.entries(currentAllocation).map(([type, value]) => `${type}: $${(value as number).toFixed(2)}`).join(', ') || 'No investments yet'}

Provide a strategic allocation recommendation:
1. Suggest 3-5 asset types with percentage allocation
2. Recommend specific investment vehicles (ETFs, index funds, etc.)
3. Explain the rationale
4. Consider diversification and rebalancing current portfolio

Return JSON format:
{
  "allocation": [
    {
      "asset_type": "S&P 500 ETF",
      "percentage": 50,
      "amount": 250,
      "rationale": "Core holding for broad market exposure",
      "recommended_tickers": ["SPY", "VOO"]
    }
  ],
  "overall_strategy": "Brief strategy summary",
  "rebalancing_needed": true,
  "confidence_score": 0.9
}`;

    console.log('Calling OpenAI GPT-4o for allocation suggestion...');

    // Calculate portfolio data for rule engine
    const cryptoAllocation = Object.entries(currentAllocation).filter(([type]) => 
      /btc|eth|crypto|bitcoin|ethereum|coin|token/i.test(type)
    ).reduce((sum, [_, val]) => sum + (val as number), 0);
    
    const cryptoPerc = totalPortfolio === 0 ? 0 : Math.round((cryptoAllocation / totalPortfolio) * 100);

    const portfolioData = {
      crypto_allocation: cryptoPerc,
      bonds_allocation: 0,
      cash_balance: 0,
      equities_allocation: 100 - cryptoPerc,
      assets: investments?.map(inv => ({
        name: inv.name,
        weight: totalPortfolio > 0 ? ((parseFloat(inv.current_price) * parseFloat(inv.quantity)) / totalPortfolio) * 100 : 0,
        value: parseFloat(inv.current_price) * parseFloat(inv.quantity),
        type: inv.type
      })) || []
    };

    // Execute AI request with rule engine
    const aiResponse = await executeAIRequest(
      portfolioData,
      {
        model: 'gpt-4o',
        temperature: 0.15,
        maxTokens: 1500,
        systemPrompt: 'You are a certified financial advisor. Always respond with valid JSON. This is informational only, not financial advice.',
        userPrompt: prompt
      },
      openaiApiKey,
      supabase,
      user.id,
      'investment_allocation'
    );

    // Parse AI response
    let suggestion;
    try {
      const jsonMatch = aiResponse.summary.match(/\{[\s\S]*\}/);
      suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse.summary);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback suggestion
      suggestion = {
        allocation: [
          {
            asset_type: 'Diversified ETF',
            percentage: 60,
            amount: (available_amount || 0) * 0.6,
            rationale: 'Balanced approach for moderate risk',
            recommended_tickers: ['VTI', 'VXUS']
          },
          {
            asset_type: 'Bonds',
            percentage: 30,
            amount: (available_amount || 0) * 0.3,
            rationale: 'Stability and income',
            recommended_tickers: ['BND', 'AGG']
          },
          {
            asset_type: 'Emergency Cash',
            percentage: 10,
            amount: (available_amount || 0) * 0.1,
            rationale: 'Liquidity buffer',
            recommended_tickers: []
          }
        ],
        overall_strategy: 'Balanced portfolio with diversification',
        rebalancing_needed: false,
        confidence_score: 0.85
      };
    }

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-investment-allocation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});