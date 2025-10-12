import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingQuestionnaire, OnboardingAnswers } from "@/components/OnboardingQuestionnaire";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  
  const handleOnboardingComplete = async (answers: OnboardingAnswers) => {
    console.log("Onboarding completed with answers:", answers);
    
    // Save answers to user profile in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            main_goal: answers.mainGoal,
            investment_interest: answers.investmentInterest,
            monthly_budget: answers.monthlyBudget,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error saving onboarding answers:", error);
          toast.error("Failed to save your preferences");
        } else {
          toast.success("Welcome! Your preferences have been saved.");
        }
      }
    } catch (error) {
      console.error("Error in onboarding completion:", error);
    }
    
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
