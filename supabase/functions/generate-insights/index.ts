// Supabase Edge Function for AI-powered financial insights
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this financial data and provide insights:\n${financialContext}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

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
