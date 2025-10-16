import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingDashboard } from "./LoadingDashboard";
import { AIOnboardingWizard } from "./onboarding/AIOnboardingWizard";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export const OnboardingWrapper = ({ children }: OnboardingWrapperProps) => {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('[OnboardingWrapper] Checking onboarding status for user:', user.id);

      // Check user_profiles for onboarding_completed
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('[OnboardingWrapper] Error fetching profile:', error);
        // If profile doesn't exist yet, wait a moment and retry (trigger might still be running)
        if (error.code === 'PGRST116') {
          console.log('[OnboardingWrapper] Profile not found, retrying in 1s...');
          setTimeout(checkOnboardingStatus, 1000);
          return;
        }
        setLoading(false);
        return;
      }

      console.log('[OnboardingWrapper] Profile found, onboarding_completed:', profile?.onboarding_completed);

      // If onboarding not completed, show the wizard
      if (!profile?.onboarding_completed) {
        setNeedsOnboarding(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('[OnboardingWrapper] Unexpected error:', error);
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    console.log('[OnboardingWrapper] Onboarding completed successfully');
    setNeedsOnboarding(false);
  };

  if (loading) {
    return <LoadingDashboard />;
  }

  if (needsOnboarding) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <AIOnboardingWizard isOpen={true} onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return <>{children}</>;
};