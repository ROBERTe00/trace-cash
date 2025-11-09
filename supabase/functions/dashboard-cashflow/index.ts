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

    const { range = '6m' } = await req.json().catch(() => ({}));

    const monthsAgo = parseInt(range) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Group by month
    const monthlyData = new Map<string, { income: number; expenses: number }>();
    
    expenses?.forEach(exp => {
      const month = exp.date.substring(0, 7); // YYYY-MM
      const current = monthlyData.get(month) || { income: 0, expenses: 0 };
      
      if (exp.type === 'Income') {
        current.income += Number(exp.amount);
      } else {
        current.expenses += Number(exp.amount);
      }
      
      monthlyData.set(month, current);
    });

    const data = Array.from(monthlyData.entries()).map(([month, values]) => ({
      month,
      income: values.income,
      expenses: values.expenses
    }));

    return new Response(JSON.stringify({
      user_id: user.id,
      range,
      currency: 'EUR',
      data,
      trend: 'stable'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dashboard-cashflow:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
