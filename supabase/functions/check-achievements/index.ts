import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Checking achievements for user:', user.id);

    // Get all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*');

    // Get user's existing achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const existingAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    // Get user data for checking
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id);

    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id);

    const { data: goals } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id);

    const unlockedAchievements: string[] = [];

    // Check each achievement
    for (const achievement of achievements || []) {
      if (existingAchievementIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.code) {
        case 'first_expense':
          shouldUnlock = (expenses?.length || 0) >= 1;
          break;
        case 'expense_streak_7':
          // Check for 7 consecutive days with expenses
          const uniqueDays = new Set(expenses?.map(e => e.date) || []);
          shouldUnlock = uniqueDays.size >= 7;
          break;
        case 'budget_master':
          // Check if user has set budget limits
          const { data: budgets } = await supabase
            .from('budget_limits')
            .select('*')
            .eq('user_id', user.id);
          shouldUnlock = (budgets?.length || 0) >= 3;
          break;
        case 'first_investment':
          shouldUnlock = (investments?.length || 0) >= 1;
          break;
        case 'diversified_portfolio':
          shouldUnlock = (investments?.length || 0) >= 5;
          break;
        case 'goal_setter':
          shouldUnlock = (goals?.length || 0) >= 1;
          break;
        case 'goal_achiever':
          shouldUnlock = goals?.some(g => g.status === 'completed') || false;
          break;
        case 'savings_100':
          const totalIncome = expenses?.filter(e => e.type === 'Income')
            .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
          const totalExpenses = expenses?.filter(e => e.type === 'Expense')
            .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
          shouldUnlock = (totalIncome - totalExpenses) >= 100;
          break;
        case 'data_driven':
          shouldUnlock = (expenses?.length || 0) >= 50;
          break;
      }

      if (shouldUnlock) {
        // Unlock achievement
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
            progress: 100,
          });

        // Add points to user level
        const { data: userLevel } = await supabase
          .from('user_levels')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const currentPoints = userLevel?.total_points || 0;
        const newTotalPoints = currentPoints + achievement.points_reward;
        const newLevel = Math.floor(newTotalPoints / 100) + 1;

        await supabase
          .from('user_levels')
          .upsert({
            user_id: user.id,
            total_points: newTotalPoints,
            level: newLevel,
            last_activity_date: new Date().toISOString().split('T')[0],
          });

        unlockedAchievements.push(achievement.name);

        console.log(`Unlocked achievement: ${achievement.name}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        unlocked: unlockedAchievements,
        count: unlockedAchievements.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-achievements:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
