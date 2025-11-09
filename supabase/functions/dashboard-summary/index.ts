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

    const { date_range = '30d' } = await req.json().catch(() => ({}));

    // Calculate date range
    const daysAgo = parseInt(date_range) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0]);

    // Fetch investments
    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id);

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Calculate KPIs
    const income = expenses?.filter(e => e.type === 'Income').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const expensesTotal = expenses?.filter(e => e.type === 'Expense').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const portfolioValue = investments?.reduce((sum, inv) => sum + (Number(inv.current_price) * Number(inv.quantity)), 0) || 0;
    
    const balanceTotal = income - expensesTotal + (Number(profile?.cash_available) || 0);
    const netWorth = balanceTotal + portfolioValue;
    const cashflow30d = income - expensesTotal;

    // Fetch goals for progress
    const { data: goals } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const savingGoalProgress = goals && goals.length > 0
      ? (goals.reduce((sum, g) => sum + Number(g.current_amount), 0) / 
         goals.reduce((sum, g) => sum + Number(g.target_amount), 0)) * 100
      : 0;

    // Calculate auto-categorized percentage
    const categorizedCount = expenses?.filter(e => e.category && e.category !== 'Other').length || 0;
    const totalExpenses = expenses?.length || 1;
    const autoCategorizedPct = (categorizedCount / totalExpenses) * 100;

    const summary = {
      balance_total: balanceTotal,
      net_worth: netWorth,
      net_worth_change_pct: 0, // TODO: Calculate from historical data
      cashflow_30d: cashflow30d,
      budget_spent_pct: 0, // TODO: Calculate from budget_limits
      saving_goal_progress_pct: savingGoalProgress,
      portfolio_return_ytd_pct: 0, // TODO: Calculate from investments
      auto_categorized_pct: autoCategorizedPct
    };

    return new Response(JSON.stringify({
      user_id: user.id,
      date_range: `${startDate.toISOString().split('T')[0]}_to_${new Date().toISOString().split('T')[0]}`,
      currency: 'EUR',
      summary,
      last_update: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dashboard-summary:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
