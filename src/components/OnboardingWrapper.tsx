import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingDashboard } from "./LoadingDashboard";
import { AIOnboardingWizard } from "./onboarding/AIOnboardingWizard";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export const OnboardingWrapper = ({ children }: OnboardingWrapperProps) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  console.log('[OnboardingWrapper] Rendering, loading:', loading, 'needsOnboarding:', needsOnboarding);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    console.log('[OnboardingWrapper] Route changed, re-checking onboarding');
    checkOnboardingStatus();
  }, [location.pathname]);

  const checkOnboardingStatus = async () => {
    try {
      // Timeout principale più breve - se passa, consideriamo che non serve onboarding
      const mainTimeoutId = setTimeout(() => {
        console.log('[OnboardingWrapper] Main timeout (5s) - skipping onboarding check, assuming completed');
        setLoading(false);
        setNeedsOnboarding(false);
      }, 5000); // 5 secondi max invece di 10

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        clearTimeout(mainTimeoutId);
        // Gestisci errori di rete silenziosamente
        if (userError.message?.includes('Failed to fetch') || 
            userError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            userError.name === 'NetworkError') {
          console.log('[OnboardingWrapper] Network error, skipping onboarding check');
          setLoading(false);
          setNeedsOnboarding(false);
          return;
        }
        console.error('[OnboardingWrapper] Error getting user:', userError);
        setLoading(false);
        setNeedsOnboarding(false);
        return;
      }
      
      if (!user) {
        clearTimeout(mainTimeoutId);
        setLoading(false);
        setNeedsOnboarding(false);
        return;
      }

      console.log('[OnboardingWrapper] Checking onboarding status for user:', user.id);

      // Check user_profiles for onboarding_completed con timeout
      try {
        const profilePromise = supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        // Timeout più breve (3 secondi invece di 5)
        const timeoutPromise = new Promise<any>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { code: 'TIMEOUT' } }), 3000)
        );

        const result = await Promise.race([profilePromise, timeoutPromise]);

        clearTimeout(mainTimeoutId);

        if (result.error) {
          // If profile doesn't exist yet, wait a moment and retry (trigger might still be running)
          if (result.error.code === 'PGRST116') {
            // Retry solo una volta, poi assume completato
            const retryCount = (window as any).__onboardingRetryCount || 0;
            if (retryCount < 1) {
              (window as any).__onboardingRetryCount = retryCount + 1;
              console.log('[OnboardingWrapper] Profile not found, retrying once...');
              setTimeout(checkOnboardingStatus, 1000);
              return;
            } else {
              console.log('[OnboardingWrapper] Profile still not found after retry, assuming completed');
              setLoading(false);
              setNeedsOnboarding(false);
              return;
            }
          }
          
          // Gestisci errori di rete - assume onboarding completato se timeout/rete
          if (result.error.code === 'TIMEOUT' || 
              result.error.message?.includes('Failed to fetch') ||
              result.error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
            console.log('[OnboardingWrapper] Network/timeout error, assuming onboarding completed');
            setLoading(false);
            setNeedsOnboarding(false); // Assume completed per non bloccare
            return;
          }

          console.error('[OnboardingWrapper] Error fetching profile:', result.error);
          setLoading(false);
          return;
        }

        console.log('[OnboardingWrapper] Profile found, onboarding_completed:', result.data?.onboarding_completed);

        // If onboarding not completed, show the wizard
        if (!result.data?.onboarding_completed) {
          setNeedsOnboarding(true);
        }

        setLoading(false);
      } catch (queryError: any) {
        clearTimeout(mainTimeoutId);
        // Gestisci errori di rete - assume completato
        if (queryError?.message?.includes('Failed to fetch') || 
            queryError?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            queryError?.name === 'NetworkError') {
          console.log('[OnboardingWrapper] Network error during profile check, assuming completed');
          setLoading(false);
          setNeedsOnboarding(false);
          return;
        }
        console.error('[OnboardingWrapper] Query error:', queryError);
        setLoading(false);
        setNeedsOnboarding(false);
      }
    } catch (error: any) {
      console.error('[OnboardingWrapper] Unexpected error:', error);
      // Gestisci errori di rete - assume completato
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
          error?.name === 'NetworkError') {
        console.log('[OnboardingWrapper] Network error, assuming onboarding completed');
      }
      setLoading(false);
      setNeedsOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    console.log('[OnboardingWrapper] Onboarding completed successfully');
    setNeedsOnboarding(false);
  };

  console.log('[OnboardingWrapper] Render check - loading:', loading, 'needsOnboarding:', needsOnboarding);

  if (loading) {
    console.log('[OnboardingWrapper] Showing loading dashboard');
    return <LoadingDashboard />;
  }

  if (needsOnboarding) {
    console.log('[OnboardingWrapper] Showing onboarding wizard');
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <AIOnboardingWizard isOpen={true} onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  console.log('[OnboardingWrapper] Rendering children');
  return <>{children}</>;
};