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

    // Fetch user data to determine actions
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const { data: statements } = await supabase
      .from('bank_statements')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const quickActions = [
      {
        label: "Scan PDF",
        icon: "📄",
        endpoint: "/transactions",
        priority: statements?.length === 0 ? 1 : 3
      },
      {
        label: "Add Transaction",
        icon: "➕",
        endpoint: "/transactions",
        priority: 2
      },
      {
        label: "View Investments",
        icon: "📈",
        endpoint: "/investments",
        priority: 4
      },
      {
        label: "Set Goals",
        icon: "🎯",
        endpoint: "/insights",
        priority: 5
      }
    ].sort((a, b) => a.priority - b.priority);

    return new Response(JSON.stringify({ quick_actions: quickActions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dashboard-actions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
