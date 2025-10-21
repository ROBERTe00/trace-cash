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

    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id);

    const portfolioValue = investments?.reduce((sum, inv) => 
      sum + (Number(inv.current_price) * Number(inv.quantity)), 0) || 0;

    const initialValue = investments?.reduce((sum, inv) => 
      sum + (Number(inv.purchase_price) * Number(inv.quantity)), 0) || 1;

    const returnYtd = ((portfolioValue - initialValue) / initialValue) * 100;

    // Group by category
    const categoryMap = new Map<string, number>();
    investments?.forEach(inv => {
      const value = Number(inv.current_price) * Number(inv.quantity);
      const current = categoryMap.get(inv.category) || 0;
      categoryMap.set(inv.category, current + value);
    });

    const allocations = Array.from(categoryMap.entries()).map(([asset_class, value]) => ({
      asset_class,
      value,
      pct: (value / portfolioValue) * 100
    }));

    return new Response(JSON.stringify({
      user_id: user.id,
      portfolio_value: portfolioValue,
      return_ytd_pct: returnYtd,
      allocations,
      performance: [] // TODO: Calculate monthly performance
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dashboard-investments:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
