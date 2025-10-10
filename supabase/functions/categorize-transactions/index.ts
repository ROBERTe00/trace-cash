import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  description: string;
  amount: number;
  date: string;
}

interface CategorizedTransaction extends Transaction {
  category: string;
  confidence: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid transactions data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Categorizing ${transactions.length} transactions...`);

    // Build prompt with transaction descriptions
    const transactionList = transactions
      .map((t: Transaction, i: number) => `${i + 1}. "${t.description}" (€${t.amount.toFixed(2)})`)
      .join('\n');

    const systemPrompt = `You are a financial transaction categorizer. Analyze transaction descriptions and assign them to one of these categories:
- Food: Groceries, restaurants, cafes, food delivery
- Transport: Gas, public transport, parking, taxi, car maintenance
- Entertainment: Movies, games, subscriptions, hobbies, sports
- Rent: Rent, utilities, housing costs
- Other: Everything else

Be smart about recognizing merchants and transaction patterns. For example:
- "ESSELUNGA" or "CARREFOUR" → Food
- "NETFLIX" or "SPOTIFY" → Entertainment
- "ENI" or "SHELL" → Transport
- "ATM MILANO" or "METRO" → Transport

Respond ONLY with a JSON array where each object has:
{
  "index": <number>,
  "category": "<category>",
  "confidence": <0-100>
}`;

    const userPrompt = `Categorize these transactions:\n${transactionList}`;

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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
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
          JSON.stringify({ error: 'AI service credits exhausted. Please add credits to your workspace.' }),
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

    // Parse AI response (handle markdown code blocks)
    let categorizations: Array<{ index: number; category: string; confidence: number }> = [];
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      categorizations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: categorize everything as "Other"
      categorizations = transactions.map((_: Transaction, i: number) => ({
        index: i,
        category: 'Other',
        confidence: 50,
      }));
    }

    // Merge categorizations with transactions
    const categorizedTransactions: CategorizedTransaction[] = transactions.map((t: Transaction, i: number) => {
      const cat = categorizations.find(c => c.index === i || c.index === i + 1);
      return {
        ...t,
        category: cat?.category || 'Other',
        confidence: cat?.confidence || 50,
      };
    });

    console.log(`Successfully categorized ${categorizedTransactions.length} transactions`);

    return new Response(
      JSON.stringify({ transactions: categorizedTransactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in categorize-transactions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        transactions: [] 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
