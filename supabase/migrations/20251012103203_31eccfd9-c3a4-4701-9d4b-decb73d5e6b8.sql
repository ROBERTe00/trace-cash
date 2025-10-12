-- Add onboarding questionnaire fields to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS main_goal TEXT,
ADD COLUMN IF NOT EXISTS investment_interest TEXT,
ADD COLUMN IF NOT EXISTS monthly_budget TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.main_goal IS 'User primary financial goal from onboarding';
COMMENT ON COLUMN public.user_profiles.investment_interest IS 'User investment interest level from onboarding';
COMMENT ON COLUMN public.user_profiles.monthly_budget IS 'User monthly budget range from onboarding';