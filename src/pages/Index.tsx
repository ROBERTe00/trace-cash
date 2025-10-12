import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingQuestionnaire, OnboardingAnswers } from "@/components/OnboardingQuestionnaire";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
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
    
    // Show guide after questionnaire
    const hasSeenGuide = localStorage.getItem("guide-completed") === "true";
    if (!hasSeenGuide) {
      setShowGuide(true);
    } else {
      navigate("/");
    }
  };

  const handleGuideComplete = () => {
    setShowGuide(false);
    navigate("/");
  };
  
  if (showOnboarding) {
    return <OnboardingQuestionnaire onComplete={handleOnboardingComplete} />;
  }

  if (showGuide) {
    return <OnboardingGuide onComplete={handleGuideComplete} />;
  }
  
  return null;
};

export default Index;
