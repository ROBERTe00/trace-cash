-- Create financial_goals table
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    deadline DATE,
    goal_type TEXT NOT NULL DEFAULT 'savings',
    linked_asset_type TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_goal_type CHECK (goal_type IN ('savings', 'investment', 'debt_payoff', 'purchase', 'emergency_fund', 'retirement')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'paused', 'cancelled'))
);

-- Enable RLS on financial_goals
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for financial_goals
CREATE POLICY "Users can manage their own goals"
ON public.financial_goals FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at on financial_goals
CREATE TRIGGER update_financial_goals_updated_at
    BEFORE UPDATE ON public.financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON public.financial_goals(status);