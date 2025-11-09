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

    const { range = '90d' } = await req.json().catch(() => ({}));

    const daysAgo = parseInt(range) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch all historical data
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id);

    // Group by month and calculate net worth
    const monthlyData = new Map<string, number>();
    
    expenses?.forEach(exp => {
      const month = exp.date.substring(0, 7); // YYYY-MM
      const current = monthlyData.get(month) || 0;
      monthlyData.set(month, current + (exp.type === 'Income' ? Number(exp.amount) : -Number(exp.amount)));
    });

    const portfolioValue = investments?.reduce((sum, inv) => 
      sum + (Number(inv.current_price) * Number(inv.quantity)), 0) || 0;

    const points = Array.from(monthlyData.entries()).map(([date, value]) => ({
      date: date + '-21',
      value: value + portfolioValue
    }));

    return new Response(JSON.stringify({
      user_id: user.id,
      range,
      currency: 'EUR',
      points,
      average_growth_pct: 0 // TODO: Calculate
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dashboard-networth:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
