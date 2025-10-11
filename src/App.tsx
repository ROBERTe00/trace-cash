import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AccountMenu } from "@/components/AccountMenu";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAOfflineIndicator } from "@/components/PWAOfflineIndicator";
import { UploadProgressBar } from "@/components/UploadProgressBar";
import { AppProvider } from "./contexts/AppContext";
import { UploadProvider } from "./contexts/UploadContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect, useState } from "react";
import { registerServiceWorker, captureInstallPrompt } from "@/lib/pwaUtils";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { LoadingDashboard } from "@/components/LoadingDashboard";
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
import { ImprovedOnboardingWizard } from "./components/ImprovedOnboardingWizard";
import { SecurityAlerts } from "./components/SecurityAlerts";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'SIGNED_OUT') {
          window.location.href = '/auth';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingDashboard />;
  }

  if (!session) {
    window.location.href = '/auth';
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 sticky top-0 bg-background/95 backdrop-blur z-10 gap-4">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <GlobalSearch />
            </div>
            <AccountMenu />
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
      <SecurityAlerts />
    </SidebarProvider>
  );
}

function App() {
  // Initialize PWA features
  useEffect(() => {
    console.log('[PWA] Initializing PWA features...');
    
    // Register service worker
    registerServiceWorker().then(registration => {
      if (registration) {
        console.log('[PWA] Service Worker registered successfully');
      }
    });

    // Capture install prompt
    captureInstallPrompt();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppProvider>
            <UploadProvider>
              <TooltipProvider>
                <Toaster />
                <PWAOfflineIndicator />
                <PWAInstallPrompt />
                <UploadProgressBar />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/*" element={<ProtectedRoutes />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </UploadProvider>
          </AppProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
