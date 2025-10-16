import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingDashboard } from "./LoadingDashboard";
import { ImprovedOnboardingWizard } from "./ImprovedOnboardingWizard";
import { FinancialOnboarding } from "./FinancialOnboarding";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export const OnboardingWrapper = ({ children }: OnboardingWrapperProps) => {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showWizard, setShowWizard] = useState(true);
  const [showFinancial, setShowFinancial] = useState(false);

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

  const handleWizardComplete = () => {
    console.log('[OnboardingWrapper] Wizard completed, showing financial onboarding');
    setShowWizard(false);
    setShowFinancial(true);
  };

  const handleFinancialComplete = async () => {
    console.log('[OnboardingWrapper] Financial onboarding completed');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user profile to mark onboarding as completed
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('[OnboardingWrapper] Error updating profile:', error);
        return;
      }

      console.log('[OnboardingWrapper] Onboarding completed successfully');
      
      // Hide onboarding and show main app
      setNeedsOnboarding(false);
      setShowFinancial(false);
    } catch (error) {
      console.error('[OnboardingWrapper] Error completing onboarding:', error);
    }
  };

  if (loading) {
    return <LoadingDashboard />;
  }

  if (needsOnboarding) {
    if (showWizard) {
      return <ImprovedOnboardingWizard isOpen={true} onComplete={handleWizardComplete} />;
    }
    
    if (showFinancial) {
      return <FinancialOnboarding isOpen={true} onComplete={handleFinancialComplete} />;
    }
  }

  return <>{children}</>;
};