import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { evaluatePortfolioRules, formatRulesForAI } from '../_shared/ruleEngine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpenseByCategory {
  category: string;
  total: number;
  count: number;
}

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

    console.log('Analyzing expense-investment correlation for user:', user.id);

    // Fetch expenses from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', threeMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (expensesError) throw expensesError;

    // Fetch investments
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id);

    if (investmentsError) throw investmentsError;

    // Calculate expense breakdown by category
    const expensesByCategory = expenses?.reduce((acc: Record<string, ExpenseByCategory>, expense) => {
      if (expense.type === 'Expense') {
        if (!acc[expense.category]) {
          acc[expense.category] = { category: expense.category, total: 0, count: 0 };
        }
        acc[expense.category].total += parseFloat(expense.amount);
        acc[expense.category].count += 1;
      }
      return acc;
    }, {}) || {};

    const sortedCategories = Object.values(expensesByCategory).sort((a, b) => b.total - a.total);

    // Calculate totals
    const totalIncome = expenses?.filter(e => e.type === 'Income').reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
    const totalExpenses = expenses?.filter(e => e.type === 'Expense').reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
    const portfolioValue = investments?.reduce((sum, inv) => sum + (parseFloat(inv.current_price) * parseFloat(inv.quantity)), 0) || 0;

    // Prepare AI prompt
    const prompt = `As a financial analyst, analyze this user's spending and investment data:

INCOME (last 3 months): $${totalIncome.toFixed(2)}
EXPENSES (last 3 months): $${totalExpenses.toFixed(2)}
SAVINGS RATE: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%

TOP EXPENSE CATEGORIES:
${sortedCategories.slice(0, 5).map(cat => `- ${cat.category}: $${cat.total.toFixed(2)} (${cat.count} transactions)`).join('\n')}

INVESTMENT PORTFOLIO: $${portfolioValue.toFixed(2)} (${investments?.length || 0} assets)

Provide:
1. Correlation score (0-1): How much do expenses reduce investment potential?
2. Impact analysis: Which 2-3 expense categories most affect investment capacity? For each, suggest realistic monthly reduction amount.
3. Projected growth: Current trajectory portfolio value in 12 months vs optimized (if suggested reductions applied).

Return JSON format:
{
  "correlation_score": 0.72,
  "impact_analysis": [
    {
      "category": "Category Name",
      "monthly_average": 650,
      "potential_reduction": 150,
      "impact_on_portfolio": "Short description",
      "suggestion": "Actionable advice"
    }
  ],
  "projected_growth": {
    "current_trajectory": 12450,
    "optimized_trajectory": 14800,
    "additional_gain": 2350
  }
}`;

    console.log('Calling OpenAI GPT-4o for analysis...');

    // DETERMINISTIC PRE-CHECK: Crypto exposure risk
    const messages: Array<{ role: string; content: string }> = [];
    
    const cryptoInvestments = investments?.filter(inv => 
      /btc|eth|crypto|bitcoin|ethereum|coin|token/i.test(inv.symbol || inv.name || inv.type || '')
    ) || [];
    
    const cryptoValue = cryptoInvestments.reduce((sum, inv) => 
      sum + (parseFloat(inv.current_price) * parseFloat(inv.quantity)), 0
    );
    
    const cryptoPerc = portfolioValue === 0 ? 0 : Math.round((cryptoValue / portfolioValue) * 100);

    // Run deterministic rule engine BEFORE AI
    const portfolioData = {
      crypto_allocation: cryptoPerc,
      bonds_allocation: 0, // Calculate if you have bond data
      cash_balance: 0, // Calculate from cash reserves
      equities_allocation: 100 - cryptoPerc,
      assets: investments?.map(inv => ({
        name: inv.name,
        weight: portfolioValue > 0 ? (parseFloat(inv.current_price) * parseFloat(inv.quantity) / portfolioValue) * 100 : 0,
        value: parseFloat(inv.current_price) * parseFloat(inv.quantity),
        type: inv.type
      })) || []
    };
    
    const ruleResult = evaluatePortfolioRules(portfolioData);
    const rulesPrompt = formatRulesForAI(ruleResult);
    
    console.log('Rule Engine Result:', JSON.stringify(ruleResult, null, 2));

    if (cryptoPerc >= 50) {
      messages.push({
        role: "system",
        content: `DETERMINISTIC RULE: Portfolio has ${cryptoPerc}% crypto exposure. This MUST be classified as HIGH RISK. You must flag this as a critical diversification issue.`
      });
    }

    // Prepend rule engine results to AI prompt
    const enhancedPrompt = rulesPrompt + prompt;

    messages.push({ role: 'system', content: 'You are a financial analyst. Always respond with valid JSON.' });
    messages.push({ role: 'user', content: enhancedPrompt });

    // Deterministic temperature for finance/investment analysis
    const temperature = 0.15;

    const startTime = Date.now();
    // Call OpenAI API
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      throw new Error('Failed to get AI response');
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices[0]?.message?.content;
    const latency = Date.now() - startTime;

    console.log('AI response received');

    // Parse AI response
    let analysis;
    try {
      // Extract JSON from response (might have markdown formatting)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback response
      analysis = {
        correlation_score: 0.5,
        impact_analysis: sortedCategories.slice(0, 3).map(cat => ({
          category: cat.category,
          monthly_average: Math.round(cat.total / 3),
          potential_reduction: Math.round(cat.total / 3 * 0.2),
          impact_on_portfolio: `Could improve savings`,
          suggestion: `Review and optimize ${cat.category} spending`
        })),
        projected_growth: {
          current_trajectory: Math.round(portfolioValue * 1.08),
          optimized_trajectory: Math.round(portfolioValue * 1.12),
          additional_gain: Math.round(portfolioValue * 0.04)
        }
      };
    }

    // Log to ai_audit_logs with rule engine results
    try {
      await supabase.from('ai_audit_logs').insert({
        user_id: user.id,
        feature: 'expense_investment_correlation',
        ai_model: 'gpt-4o',
        temperature,
        input_prompt: `RULE ENGINE: ${JSON.stringify(ruleResult)}\n\nPROMPT: ${prompt}`,
        ai_raw_response: aiContent,
        ui_summary: JSON.stringify({ ...analysis, rule_engine: ruleResult }),
        latency_ms: latency,
        success: true
      });
    } catch (logError) {
      console.error('Failed to log AI audit:', logError);
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-expense-investment-correlation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});