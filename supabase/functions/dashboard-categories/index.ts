import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { period } = await req.json().catch(() => ({}));
    const currentMonth = period || new Date().toISOString().substring(0, 7);

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'Expense')
      .gte('date', currentMonth + '-01')
      .lte('date', currentMonth + '-31');

    // Group by category
    const categoryMap = new Map<string, number>();
    expenses?.forEach(exp => {
      const current = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, current + Number(exp.amount));
    });

    const totalExpenses = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

    const categories = Array.from(categoryMap.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / totalExpenses) * 100
    })).sort((a, b) => b.amount - a.amount);

    // Top merchants
    const merchantMap = new Map<string, number>();
    expenses?.forEach(exp => {
      const merchant = exp.description.split(' ')[0];
      const current = merchantMap.get(merchant) || 0;
      merchantMap.set(merchant, current + Number(exp.amount));
    });

    const topMerchants = Array.from(merchantMap.entries())
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return new Response(JSON.stringify({
      user_id: user.id,
      period: currentMonth,
      categories,
      top_merchants: topMerchants
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dashboard-categories:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
