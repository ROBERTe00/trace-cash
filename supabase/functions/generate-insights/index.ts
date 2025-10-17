// Supabase Edge Function for AI-powered financial insights
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const financialDataSchema = z.object({
  data: z.object({
    expenses: z.array(z.object({
      category: z.string().max(50),
      amount: z.number().min(0).max(1000000),
      date: z.string()
    })).max(1000),
    investments: z.array(z.object({
      type: z.string().max(50),
      value: z.number().min(0).max(100000000).nullable()
    })).max(200),
    summary: z.object({
      totalIncome: z.number().min(0).max(100000000),
      totalExpenses: z.number().min(0).max(100000000),
      netBalance: z.number().min(-100000000).max(100000000)
    })
  })
});

interface FinancialData {
  expenses: Array<{
    category: string;
    amount: number;
    date: string;
  }>;
  investments: Array<{
    type: string;
    value: number;
  }>;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
    
    const { data } = validation.data;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating financial insights...');

    // Analyze expense trends
    const expensesByCategory = data.expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Build context for AI
    const financialContext = `
Financial Summary:
- Total Income: €${data.summary.totalIncome.toFixed(2)}
- Total Expenses: €${data.summary.totalExpenses.toFixed(2)}
- Net Balance: €${data.summary.netBalance.toFixed(2)}
- Savings Rate: ${data.summary.totalIncome > 0 ? ((1 - (data.summary.totalExpenses / data.summary.totalIncome)) * 100).toFixed(1) : 0}%

Top Expense Categories:
${topCategories.map(([cat, amt]) => `- ${cat}: €${amt.toFixed(2)} (${((amt / data.summary.totalExpenses) * 100).toFixed(1)}%)`).join('\n')}

Investment Portfolio:
${data.investments.length > 0 
  ? data.investments.map(inv => `- ${inv.type}: €${(inv.value || 0).toFixed(2)}`).join('\n')
  : '- No investments yet'}
`;

    const systemPrompt = `You are a professional financial advisor analyzing a user's financial data. 
Provide 3-5 actionable insights based on their spending patterns, income, and savings.

Format your response as a JSON array of insights:
[
  {
    "title": "Clear, engaging title",
    "description": "Detailed explanation (2-3 sentences)",
    "type": "warning" | "tip" | "success" | "info",
    "actionable": "Specific action the user can take"
  }
]

Focus on:
1. Unusual spending patterns or trends
2. Budget optimization opportunities
3. Savings and investment recommendations
4. Areas where the user is doing well
5. Potential financial risks

Be specific, use actual numbers from the data, and make insights actionable.`;

    const startTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this financial data and provide insights:\n${financialContext}` },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'OpenAI credits exhausted. Please check your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid OpenAI API key.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    const latency = Date.now() - startTime;

    if (!content) {
      throw new Error('No response from AI service');
    }

    console.log('AI Response:', content);

    // Parse AI response
    let insights: any[] = [];
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // Fallback: create generic insights
      insights = [
        {
          title: "Track Your Spending",
          description: `You've spent €${data.summary.totalExpenses.toFixed(2)} so far. Consider setting monthly budgets for each category.`,
          type: "tip",
          actionable: "Set up category budgets in the Budget Tracker"
        }
      ];
    }

    console.log(`Generated ${insights.length} insights`);

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
          feature: 'generate_insights',
          ai_model: 'gpt-4o',
          temperature: 0.2,
          input_prompt: systemPrompt,
          ai_raw_response: content,
          ui_summary: JSON.stringify(insights),
          latency_ms: latency,
          success: true
        });
      }
    } catch (logError) {
      console.error('Failed to log AI audit:', logError);
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-insights:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
