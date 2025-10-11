import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingQuestionnaire, OnboardingAnswers } from "@/components/OnboardingQuestionnaire";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const shouldShowOnboarding = localStorage.getItem("show-onboarding") === "true";
        const hasCompletedOnboarding = localStorage.getItem("onboarding-completed") === "true";
        
        if (shouldShowOnboarding && !hasCompletedOnboarding) {
          setShowOnboarding(true);
          localStorage.removeItem("show-onboarding");
        } else {
          navigate("/");
        }
      } else {
        navigate("/auth");
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleOnboardingComplete = (answers: OnboardingAnswers) => {
    console.log("Onboarding completed with answers:", answers);
    setShowOnboarding(false);
    navigate("/");
  };
  
  if (showOnboarding) {
    return <OnboardingQuestionnaire onComplete={handleOnboardingComplete} />;
  }
  
  return null;
};

export default Index;
