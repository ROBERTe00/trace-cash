-- Create trigger to automatically create user profile on signup
-- This ensures every new user has a profile with onboarding_completed = false

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile for the user with default values
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

-- Create trigger that fires after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();