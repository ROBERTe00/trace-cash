-- Create expenses table with full tracking and correlations
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
  recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
  linked_investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses" ON public.expenses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON public.expenses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON public.expenses 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses 
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(user_id, type);

-- Add investment correlation fields
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Stock';

-- Create investment suggestions table
CREATE TABLE IF NOT EXISTS public.investment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  amount_suggested DECIMAL(12, 2),
  asset_type TEXT,
  reasoning TEXT,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS for suggestions
ALTER TABLE public.investment_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own suggestions" ON public.investment_suggestions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions" ON public.investment_suggestions 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create budget limits table
CREATE TABLE IF NOT EXISTS public.budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit DECIMAL(12, 2) NOT NULL,
  alert_threshold DECIMAL(3, 2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budget limits" ON public.budget_limits 
  FOR ALL USING (auth.uid() = user_id);

-- Add subscription tier to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Create function to calculate savings potential
CREATE OR REPLACE FUNCTION public.calculate_savings_potential(p_user_id UUID, p_threshold DECIMAL DEFAULT 200)
RETURNS TABLE (
  available_savings DECIMAL,
  monthly_income DECIMAL,
  monthly_expenses DECIMAL,
  savings_rate DECIMAL,
  suggestion TEXT
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function for investment suggestions
CREATE OR REPLACE FUNCTION public.trigger_investment_suggestion()
RETURNS TRIGGER AS $$
DECLARE
  savings_amount DECIMAL;
  threshold_amount DECIMAL := 200;
  existing_suggestion_count INT;
BEGIN
  -- Calculate available savings after new expense/income
  SELECT available_savings INTO savings_amount
  FROM public.calculate_savings_potential(NEW.user_id, threshold_amount);

  -- Check if there's already a pending suggestion
  SELECT COUNT(*) INTO existing_suggestion_count
  FROM public.investment_suggestions
  WHERE user_id = NEW.user_id 
    AND status = 'pending' 
    AND suggestion_type = 'allocate_savings';

  -- If savings exceed threshold and no pending suggestions, create one
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on expenses
DROP TRIGGER IF EXISTS after_expense_insert ON public.expenses;
CREATE TRIGGER after_expense_insert
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_investment_suggestion();

-- Create trigger for updated_at on expenses
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();