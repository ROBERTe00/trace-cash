// Supabase Edge Function for parsing CSV/Excel files

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size must be less than 5MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Read file content
    const fileContent = await file.text();
    
    // Simple CSV parser (handles basic CSV format)
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'File is empty or has no data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse header and detect columns
    const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    console.log('Headers found:', headers);

    // Find column indices
    const dateIdx = headers.findIndex(h => 
      h.includes('date') || h.includes('data') || h.includes('posting')
    );
    const descIdx = headers.findIndex(h => 
      h.includes('description') || h.includes('descrizione') || h.includes('details') || 
      h.includes('merchant') || h.includes('payee')
    );
    const amountIdx = headers.findIndex(h => 
      h.includes('amount') || h.includes('importo') || h.includes('value') || 
      h.includes('debit') || h.includes('credit')
    );

    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not find required columns (date, description, amount)',
          foundHeaders: headers 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Column indices - Date: ${dateIdx}, Description: ${descIdx}, Amount: ${amountIdx}`);

    // Parse data rows
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add last value

      if (values.length <= Math.max(dateIdx, descIdx, amountIdx)) {
        errors.push(`Row ${i + 1}: Invalid format`);
        continue;
      }

      // Parse date
      let dateStr = values[dateIdx].replace(/"/g, '');
      let parsedDate: string | null = null;
      
      // Try different date formats
      const datePatterns = [
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      ];

      for (const pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (pattern === datePatterns[0]) {
            parsedDate = dateStr;
          } else {
            const [, day, month, year] = match;
            parsedDate = `${year}-${month}-${day}`;
          }
          break;
        }
      }

      if (!parsedDate) {
        // Try parsing as Date object
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            parsedDate = date.toISOString().split('T')[0];
          }
        } catch {}
      }

      if (!parsedDate) {
        errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
        continue;
      }

      // Parse amount
      const amountStr = values[amountIdx].replace(/"/g, '');
      const cleanAmount = amountStr.replace(/[€$£,\s]/g, '').replace(',', '.');
      const amount = Math.abs(parseFloat(cleanAmount));

      if (isNaN(amount) || amount === 0) {
        errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
        continue;
      }

      // Get description
      const description = values[descIdx].replace(/"/g, '').trim();
      if (!description) {
        errors.push(`Row ${i + 1}: Empty description`);
        continue;
      }

      transactions.push({
        date: parsedDate,
        description,
        amount,
      });
    }

    console.log(`Parsed ${transactions.length} transactions with ${errors.length} errors`);

    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid transactions found',
          parseErrors: errors.slice(0, 10)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now categorize transactions using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      // Return without categories
      return new Response(
        JSON.stringify({ 
          transactions,
          errors,
          stats: {
            total: lines.length - 1,
            valid: transactions.length,
            invalid: errors.length,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Categorize with AI
    const transactionList = transactions
      .map((t, i) => `${i + 1}. "${t.description}" (€${t.amount.toFixed(2)})`)
      .join('\n');

    const systemPrompt = `You are a financial transaction categorizer. Analyze transaction descriptions and assign them to one of these categories:
- Food: Groceries, restaurants, cafes, food delivery
- Transport: Gas, public transport, parking, taxi, car maintenance
- Entertainment: Movies, games, subscriptions, hobbies, sports
- Rent: Rent, utilities, housing costs
- Other: Everything else

Be smart about recognizing merchants. Examples:
- "ESSELUNGA" or "CARREFOUR" → Food
- "NETFLIX" or "SPOTIFY" → Entertainment
- "ENI" or "SHELL" → Transport
- "ATM MILANO" → Transport

Respond ONLY with a JSON array: [{"index": 0, "category": "Food", "confidence": 95}, ...]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Categorize these transactions:\n${transactionList}` },
        ],
        temperature: 0.3,
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

          // Apply categories
          transactions.forEach((t, i) => {
            const cat = categorizations.find((c: any) => c.index === i || c.index === i + 1);
            if (cat) {
              t.category = cat.category || 'Other';
            } else {
              t.category = 'Other';
            }
          });

          console.log('AI categorization successful');
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          // Set default category
          transactions.forEach(t => t.category = 'Other');
        }
      }
    } else {
      console.error('AI categorization failed:', aiResponse.status);
      // Set default category
      transactions.forEach(t => t.category = 'Other');
    }

    return new Response(
      JSON.stringify({ 
        transactions,
        errors,
        stats: {
          total: lines.length - 1,
          valid: transactions.length,
          invalid: errors.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-csv-excel:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
