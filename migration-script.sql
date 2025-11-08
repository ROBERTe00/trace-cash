-- =====================================================
-- SCRIPT DI MIGRAZIONE COMPLETA SUPABASE
-- Da progetto: bexsbrlwjelfgmcvnmrf
-- A progetto: xhidguwfmakncpgicjzg
-- =====================================================
-- ISTRUZIONI:
-- 1. Eseguire questo script sul NUOVO progetto xhidguwfmakncpgicjzg
-- 2. Dopo aver eseguito questo script, importare i DATI dal vecchio progetto
-- 3. Configurare i secrets nelle Edge Functions
-- 4. Deploy delle Edge Functions
-- =====================================================

-- =====================================================
-- PARTE 1: ENUM E TIPI CUSTOM
-- =====================================================

-- Enum per i ruoli utente
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =====================================================
-- PARTE 2: CREAZIONE TABELLE
-- =====================================================

-- Tabella: achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  points_reward INTEGER DEFAULT 0,
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: user_achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress NUMERIC DEFAULT 100
);

-- Tabella: user_levels
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: user_profiles
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  cash_available NUMERIC DEFAULT 0,
  monthly_income NUMERIC DEFAULT 0,
  monthly_budget TEXT,
  main_goal TEXT,
  investment_interest TEXT,
  income_sources JSONB DEFAULT '[]'::jsonb,
  assets JSONB DEFAULT '[]'::jsonb,
  debts JSONB DEFAULT '[]'::jsonb,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabella: expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT,
  linked_investment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: investments
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  category TEXT DEFAULT 'Stock',
  sector TEXT,
  quantity NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  purchase_date DATE,
  live_tracking BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: financial_goals
CREATE TABLE public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'savings',
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  investment_link TEXT,
  linked_asset_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: investment_suggestions
CREATE TABLE public.investment_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  asset_type TEXT,
  amount_suggested NUMERIC,
  reasoning TEXT,
  confidence_score NUMERIC,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: budget_limits
CREATE TABLE public.budget_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  alert_threshold NUMERIC DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: bank_statements
CREATE TABLE public.bank_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  action_url TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: audit_logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: ai_audit_logs
CREATE TABLE public.ai_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  input_prompt TEXT NOT NULL,
  ai_raw_response TEXT NOT NULL,
  ui_summary TEXT,
  temperature NUMERIC,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: ai_feedback
CREATE TABLE public.ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  original_category TEXT NOT NULL,
  corrected_category TEXT NOT NULL,
  amount NUMERIC,
  context JSONB,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: security_alerts
CREATE TABLE public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: mfa_credentials
CREATE TABLE public.mfa_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  device_name TEXT,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Tabella: challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT,
  target_value NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: user_challenges
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  progress NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: leaderboard_entries
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anonymous_name TEXT,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements_count INTEGER DEFAULT 0,
  rank INTEGER,
  period TEXT DEFAULT 'all_time',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, period)
);

-- Tabella: community_posts
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content TEXT NOT NULL,
  portfolio_data JSONB,
  is_anonymous BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: community_comments
CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: community_likes
CREATE TABLE public.community_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Tabella: shared_templates
CREATE TABLE public.shared_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: template_ratings
CREATE TABLE public.template_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.shared_templates(id),
  user_id UUID NOT NULL,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella: push_subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- PARTE 3: VIEWS
-- =====================================================

-- View: community_posts_public
CREATE OR REPLACE VIEW public.community_posts_public AS
SELECT 
  id,
  user_id,
  content,
  portfolio_data,
  is_anonymous,
  likes_count,
  created_at
FROM public.community_posts;

-- View: community_likes_count
CREATE OR REPLACE VIEW public.community_likes_count AS
SELECT 
  post_id,
  COUNT(*) as likes_count
FROM public.community_likes
GROUP BY post_id;

-- =====================================================
-- PARTE 4: FUNZIONI SQL
-- =====================================================

-- Funzione: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Funzione: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Funzione: handle_new_user_profile
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    onboarding_completed,
    subscription_tier,
    monthly_income,
    cash_available
  ) VALUES (
    NEW.id,
    false,
    'free',
    0,
    0
  );
  
  RETURN NEW;
END;
$$;

-- Funzione: notify_goal_progress
CREATE OR REPLACE FUNCTION public.notify_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress_percentage DECIMAL;
BEGIN
  progress_percentage := (NEW.current_amount / NULLIF(NEW.target_amount, 0)) * 100;
  
  IF progress_percentage >= 25 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 25 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎯 Goal Progress: 25%',
      'Your goal "' || NEW.title || '" is 25% complete! Keep going!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 25)
    );
  ELSIF progress_percentage >= 50 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 50 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎯 Goal Progress: 50%',
      'You''re halfway to your goal "' || NEW.title || '"! Great progress!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 50)
    );
  ELSIF progress_percentage >= 75 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 75 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎯 Goal Progress: 75%',
      'Almost there! Your goal "' || NEW.title || '" is 75% complete!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 75)
    );
  ELSIF progress_percentage >= 90 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 90 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🔥 Goal Progress: 90%',
      'So close! Your goal "' || NEW.title || '" is 90% complete!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 90)
    );
  ELSIF progress_percentage >= 100 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 100 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎉 Goal Achieved!',
      'Congratulations! You''ve completed your goal "' || NEW.title || '"!',
      'success',
      jsonb_build_object('goal_id', NEW.id, 'progress', 100)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Funzione: trigger_investment_suggestion
CREATE OR REPLACE FUNCTION public.trigger_investment_suggestion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  savings_amount DECIMAL;
  threshold_amount DECIMAL := 200;
  existing_suggestion_count INT;
BEGIN
  SELECT available_savings INTO savings_amount
  FROM public.calculate_savings_potential(NEW.user_id, threshold_amount);

  SELECT COUNT(*) INTO existing_suggestion_count
  FROM public.investment_suggestions
  WHERE user_id = NEW.user_id 
    AND status = 'pending' 
    AND suggestion_type = 'allocate_savings';

  IF savings_amount >= threshold_amount AND existing_suggestion_count = 0 THEN
    INSERT INTO public.investment_suggestions (
      user_id, suggestion_type, amount_suggested, 
      asset_type, reasoning, confidence_score, expires_at
    ) VALUES (
      NEW.user_id,
      'allocate_savings',
      savings_amount * 0.7,
      'ETF',
      'You have $' || savings_amount::TEXT || ' available. Consider allocating 70% to a diversified ETF.',
      0.85,
      NOW() + INTERVAL '7 days'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Funzione: calculate_savings_potential
CREATE OR REPLACE FUNCTION public.calculate_savings_potential(p_user_id uuid, p_threshold numeric DEFAULT 200)
RETURNS TABLE(
  available_savings numeric,
  monthly_income numeric,
  monthly_expenses numeric,
  savings_rate numeric,
  suggestion text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH income_data AS (
    SELECT COALESCE(SUM(amount), 0) as total_income
    FROM public.expenses
    WHERE user_id = p_user_id AND type = 'Income' 
      AND date >= CURRENT_DATE - INTERVAL '30 days'
  ),
  expense_data AS (
    SELECT COALESCE(SUM(amount), 0) as total_expenses
    FROM public.expenses
    WHERE user_id = p_user_id AND type = 'Expense'
      AND date >= CURRENT_DATE - INTERVAL '30 days'
  )
  SELECT 
    (income_data.total_income - expense_data.total_expenses)::DECIMAL as available_savings,
    income_data.total_income::DECIMAL,
    expense_data.total_expenses::DECIMAL,
    CASE 
      WHEN income_data.total_income > 0 
      THEN ((income_data.total_income - expense_data.total_expenses) / income_data.total_income * 100)::DECIMAL
      ELSE 0::DECIMAL
    END as savings_rate,
    CASE
      WHEN (income_data.total_income - expense_data.total_expenses) >= p_threshold
      THEN 'Consider investing $' || (income_data.total_income - expense_data.total_expenses)::TEXT || ' in low-risk ETFs'
      WHEN (income_data.total_income - expense_data.total_expenses) > 0
      THEN 'Save more to reach investment threshold of $' || p_threshold::TEXT
      ELSE 'Focus on reducing expenses to free up investment capital'
    END as suggestion
  FROM income_data, expense_data;
END;
$$;

-- Funzione: update_leaderboard
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

-- =====================================================
-- PARTE 5: TRIGGERS
-- =====================================================

-- Trigger: on_auth_user_created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Trigger: update_financial_goals_updated_at
CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: notify_goal_progress_trigger
CREATE TRIGGER notify_goal_progress_trigger
  AFTER UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.notify_goal_progress();

-- Trigger: update_expenses_updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: trigger_investment_suggestion_on_expense
CREATE TRIGGER trigger_investment_suggestion_on_expense
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.trigger_investment_suggestion();

-- Trigger: update_investments_updated_at
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_user_profiles_updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_user_levels_updated_at
CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_shared_templates_updated_at
CREATE TRIGGER update_shared_templates_updated_at
  BEFORE UPDATE ON public.shared_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_leaderboard_entries_updated_at
CREATE TRIGGER update_leaderboard_entries_updated_at
  BEFORE UPDATE ON public.leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_push_subscriptions_updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PARTE 6: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Abilitare RLS su tutte le tabelle
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: achievements
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- Policy: user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: user_levels
CREATE POLICY "Users can view their own level" ON public.user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own level" ON public.user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own level" ON public.user_levels FOR UPDATE USING (auth.uid() = user_id);

-- Policy: user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Policy: expenses
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Policy: investments
CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- Policy: financial_goals
CREATE POLICY "Users can manage their own goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- Policy: investment_suggestions
CREATE POLICY "Users view own suggestions" ON public.investment_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestions" ON public.investment_suggestions FOR UPDATE USING (auth.uid() = user_id);

-- Policy: budget_limits
CREATE POLICY "Users manage own budget limits" ON public.budget_limits FOR ALL USING (auth.uid() = user_id);

-- Policy: bank_statements
CREATE POLICY "Users can view their own statements" ON public.bank_statements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can upload their own statements" ON public.bank_statements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own statements" ON public.bank_statements FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own statements" ON public.bank_statements FOR DELETE USING (user_id = auth.uid());

-- Policy: notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Policy: audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Policy: ai_audit_logs
CREATE POLICY "Users can view their own AI logs" ON public.ai_audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI logs" ON public.ai_audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: ai_feedback
CREATE POLICY "Users can view their own feedback" ON public.ai_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create feedback" ON public.ai_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.ai_feedback FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Policy: security_alerts
CREATE POLICY "Users can view their own alerts" ON public.security_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can acknowledge their alerts" ON public.security_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: mfa_credentials
CREATE POLICY "Users can view their own MFA credentials" ON public.mfa_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own MFA credentials" ON public.mfa_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own MFA credentials" ON public.mfa_credentials FOR DELETE USING (auth.uid() = user_id);

-- Policy: challenges
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (end_date >= CURRENT_DATE);

-- Policy: user_challenges
CREATE POLICY "Users can view their own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Policy: leaderboard_entries
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert their own leaderboard entry" ON public.leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leaderboard entry" ON public.leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);

-- Policy: community_posts
CREATE POLICY "Anyone can view posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Policy: community_comments
CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.community_comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);

-- Policy: community_likes
CREATE POLICY "Users can view their own likes" ON public.community_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can like posts" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.community_likes FOR DELETE USING (auth.uid() = user_id);

-- Policy: shared_templates
CREATE POLICY "Anyone can view public templates" ON public.shared_templates FOR SELECT USING ((is_public = true) OR (auth.uid() = user_id));
CREATE POLICY "Users can create their own templates" ON public.shared_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.shared_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.shared_templates FOR DELETE USING (auth.uid() = user_id);

-- Policy: template_ratings
CREATE POLICY "Anyone can view ratings" ON public.template_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create their own ratings" ON public.template_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.template_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Policy: push_subscriptions
CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 7: STORAGE BUCKETS
-- =====================================================

-- Bucket: bank-statements (privato)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bank-statements', 'bank-statements', false);

-- Policy storage per bank-statements
CREATE POLICY "Users can view their own bank statements"
ON storage.objects FOR SELECT
USING (bucket_id = 'bank-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own bank statements"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bank-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own bank statements"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bank-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own bank statements"
ON storage.objects FOR DELETE
USING (bucket_id = 'bank-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- FINE DELLO SCRIPT
-- =====================================================

-- NOTA: Dopo aver eseguito questo script, dovrai:
-- 1. Esportare i DATI dal vecchio progetto
-- 2. Importare i dati in questo nuovo progetto
-- 3. Configurare i secrets per le Edge Functions:
--    - OPENAI_API_KEY
--    - NEWS_API_KEY
--    - Altri secrets necessari
-- 4. Fare deploy delle Edge Functions con: npx supabase functions deploy
