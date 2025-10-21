import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const transactionSchema = z.object({
  transactions: z.array(z.object({
    date: z.string(),
    description: z.string().min(1).max(500),
    amount: z.number().min(0).max(1000000),
  })).min(1).max(500),
});

interface CategorizedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
  needsReview?: boolean;
}

const CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Bills', 'Healthcare',
  'Shopping', 'Investments', 'Education', 'Travel', 'Other'
];

// Keywords for internal categorization
const KEYWORDS: Record<string, string[]> = {
  Food: ['restaurant', 'cafe', 'grocery', 'supermarket', 'food', 'pizza', 'burger', 'esselunga', 'carrefour', 'coop', 'conad', 'lidl', 'eataly'],
  Transport: ['gas', 'fuel', 'taxi', 'uber', 'train', 'bus', 'parking', 'toll', 'atm milano', 'trenitalia', 'eni', 'shell', 'q8', 'agip'],
  Entertainment: ['cinema', 'movie', 'netflix', 'spotify', 'game', 'concert', 'theater', 'gym', 'fitness'],
  Bills: ['electric', 'water', 'gas bill', 'internet', 'phone', 'rent', 'insurance', 'enel', 'vodafone', 'tim', 'wind'],
  Healthcare: ['pharmacy', 'doctor', 'hospital', 'clinic', 'medical', 'dentist', 'farmacia'],
  Shopping: ['amazon', 'ebay', 'store', 'shop', 'mall', 'zara', 'h&m', 'ikea'],
  Investments: ['investment', 'stock', 'trading', 'crypto', 'etf', 'savings'],
  Education: ['school', 'university', 'course', 'book', 'tuition', 'education'],
  Travel: ['hotel', 'flight', 'airbnb', 'booking', 'airline', 'ryanair', 'easyjet'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validation = transactionSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transactions } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiEndpoint = LOVABLE_API_KEY 
      ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const aiKey = LOVABLE_API_KEY || OPENAI_API_KEY;

    console.log(`Categorizing ${transactions.length} transactions`);

    // Step 1: Try keyword matching first
    const results: CategorizedTransaction[] = [];
    const uncategorized: Array<{ index: number; description: string }> = [];

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const desc = t.description.toLowerCase();
      
      let matchedCategory = 'Other';
      let confidence = 50;

      // Check keywords
      for (const [category, keywords] of Object.entries(KEYWORDS)) {
        const match = keywords.some(kw => desc.includes(kw.toLowerCase()));
        if (match) {
          matchedCategory = category;
          confidence = 85;
          break;
        }
      }

      if (confidence < 70) {
        uncategorized.push({ index: i, description: t.description });
      }

      results.push({
        ...t,
        category: matchedCategory,
        confidence,
        needsReview: confidence < 70,
      });
    }

    // Step 2: Use AI for uncategorized transactions
    if (uncategorized.length > 0) {
      console.log(`Using AI for ${uncategorized.length} uncategorized transactions`);
      
      const transactionList = uncategorized
        .map(u => `${u.index}. "${u.description}"`)
        .join('\n');

      const systemPrompt = `You are a financial categorization AI. Analyze transaction descriptions and assign them to one of these categories ONLY: ${CATEGORIES.join(', ')}.

Instructions:
1. Analyze the merchant name or description
2. Assign to the most appropriate category
3. Provide a confidence score (0-100)
4. If unsure and the merchant is identifiable (e.g., a brand), you may need to search for it

Respond ONLY with a JSON array:
[
  {"index": 0, "category": "Food", "confidence": 95, "reasoning": "Restaurant name"},
  {"index": 1, "category": "Healthcare", "confidence": 70, "needsSearch": true}
]`;

      const aiResponse = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LOVABLE_API_KEY ? 'google/gemini-2.5-flash' : 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Categorize these transactions:\n${transactionList}` },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (content) {
          try {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
            const categorizations = JSON.parse(jsonStr);

            // Apply AI categorizations
            for (const cat of categorizations) {
              if (cat.index !== undefined && results[cat.index]) {
                const validCategory = CATEGORIES.includes(cat.category) ? cat.category : 'Other';
                results[cat.index].category = validCategory;
                results[cat.index].confidence = Math.min(100, Math.max(0, cat.confidence || 70));
                results[cat.index].needsReview = results[cat.index].confidence < 70;
              }
            }

            console.log('AI categorization successful');
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
          }
        }
      }
    }

    // Step 3: Count items needing review
    const needsReviewCount = results.filter(r => r.needsReview).length;

    return new Response(
      JSON.stringify({
        transactions: results,
        stats: {
          total: results.length,
          highConfidence: results.filter(r => r.confidence >= 70).length,
          needsReview: needsReviewCount,
          avgConfidence: Math.round(
            results.reduce((sum, r) => sum + r.confidence, 0) / results.length
          ),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in categorize-transactions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
