import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./Dashboard";
import Auth from "./Auth";
import type { User, Session } from "@supabase/supabase-js";
import { ImprovedOnboardingWizard } from "@/components/ImprovedOnboardingWizard";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    console.log("🔐 [Index] Setting up auth listener...");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔐 [Index] Auth state changed:", event, "User:", session?.user?.email || "none");
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check onboarding after auth is confirmed
        if (session?.user) {
          const onboardingCompleted = localStorage.getItem("onboarding_completed");
          if (!onboardingCompleted) {
            console.log("🎯 [Index] Showing onboarding wizard");
            setShowOnboarding(true);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🔐 [Index] Initial session check:", session?.user?.email || "none");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check onboarding for initial session
      if (session?.user) {
        const onboardingCompleted = localStorage.getItem("onboarding_completed");
        if (!onboardingCompleted) {
          console.log("🎯 [Index] Showing onboarding wizard (initial)");
          setShowOnboarding(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOnboardingComplete = () => {
    console.log("🎯 [Index] Onboarding completed");
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <ImprovedOnboardingWizard isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
      <Dashboard />
    </>
  );
};

export default Index;
