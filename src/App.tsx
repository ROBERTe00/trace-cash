import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppProvider } from "./contexts/AppContext";
import { UploadProvider } from "./contexts/UploadContext";
import Index from "./pages/Index";
import DashboardHome from "./pages/DashboardHome";
import Expenses from "./pages/Expenses";
import Investments from "./pages/Investments";
import Insights from "./pages/Insights";
import FuturePlanner from "./pages/FuturePlanner";
import ProgressHub from "./pages/ProgressHub";
import Upload from "./pages/Upload";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { useState, useEffect } from "react";
import { getUser } from "./lib/storage";

const queryClient = new QueryClient();

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const user = getUser();
    setIsAuthenticated(!!user);
    
    // Check if onboarding was completed
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    if (user && !onboardingCompleted) {
      setShowOnboarding(true);
    }
    
    setLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-2xl gradient-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <SidebarProvider>
      <OnboardingWizard isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/future-planner" element={<FuturePlanner />} />
              <Route path="/progress" element={<ProgressHub />} />
              <Route path="/community" element={<Community />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AppProvider>
          <UploadProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </UploadProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
