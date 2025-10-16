-- Fase 4: Gamification Tables (only missing tables)

-- 1. User Levels & Points System
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Achievements & Badges
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_reward INTEGER DEFAULT 0,
  category TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  progress DECIMAL DEFAULT 100,
  UNIQUE(user_id, achievement_id)
);

-- 3. Monthly Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT,
  target_value DECIMAL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress DECIMAL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- 4. Leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_name TEXT,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements_count INTEGER DEFAULT 0,
  rank INTEGER,
  period TEXT DEFAULT 'all_time',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period)
);

-- 5. Template Sharing
CREATE TABLE IF NOT EXISTS public.shared_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.shared_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own level" ON public.user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own level" ON public.user_levels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own level" ON public.user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (end_date >= CURRENT_DATE);

CREATE POLICY "Users can view their own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Users can update their own leaderboard entry" ON public.leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own leaderboard entry" ON public.leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public templates" ON public.shared_templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.shared_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.shared_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.shared_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view ratings" ON public.template_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create their own ratings" ON public.template_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.template_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_user_levels_updated_at BEFORE UPDATE ON public.user_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leaderboard_entries_updated_at BEFORE UPDATE ON public.leaderboard_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shared_templates_updated_at BEFORE UPDATE ON public.shared_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leaderboard function
CREATE OR REPLACE FUNCTION public.update_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_entries (user_id, anonymous_name, total_points, level, achievements_count, period)
  SELECT 
    ul.user_id,
    'Player' || SUBSTRING(ul.user_id::TEXT FROM 1 FOR 6),
    ul.total_points,
    ul.level,
    COUNT(ua.id),
    'all_time'
  FROM public.user_levels ul
  LEFT JOIN public.user_achievements ua ON ul.user_id = ua.user_id
  GROUP BY ul.user_id, ul.total_points, ul.level
  ON CONFLICT (user_id, period) 
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    level = EXCLUDED.level,
    achievements_count = EXCLUDED.achievements_count,
    updated_at = now();
    
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as new_rank
    FROM public.leaderboard_entries
    WHERE period = 'all_time'
  )
  UPDATE public.leaderboard_entries le
  SET rank = ranked.new_rank
  FROM ranked
  WHERE le.id = ranked.id;
END;
$$;

-- Default achievements
INSERT INTO public.achievements (code, name, description, icon, points_reward, category) VALUES
  ('first_expense', 'First Steps', 'Add your first expense', '🎯', 10, 'consistency'),
  ('week_streak', 'Week Warrior', 'Track expenses for 7 days straight', '🔥', 50, 'consistency'),
  ('month_streak', 'Monthly Master', 'Track expenses for 30 days straight', '💪', 200, 'consistency'),
  ('budget_keeper', 'Budget Keeper', 'Stay within budget for a month', '💰', 100, 'savings'),
  ('investor_start', 'Investor Beginner', 'Make your first investment', '📈', 50, 'investments'),
  ('portfolio_5k', 'Portfolio Builder', 'Reach €5,000 in investments', '💎', 150, 'investments'),
  ('goal_achieved', 'Goal Getter', 'Complete your first financial goal', '🎉', 100, 'goals'),
  ('saver_1k', 'Smart Saver', 'Save €1,000', '🐷', 100, 'savings'),
  ('export_master', 'Data Expert', 'Export your financial data', '📊', 25, 'consistency')
ON CONFLICT (code) DO NOTHING;