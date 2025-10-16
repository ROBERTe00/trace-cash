import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AccountMenu } from "@/components/AccountMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAOfflineIndicator } from "@/components/PWAOfflineIndicator";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
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
import Transactions from "./pages/Transactions";
import Investments from "./pages/Investments";
import Insights from "./pages/Insights";
import FuturePlanner from "./pages/FuturePlanner";
import News from "./pages/News";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { SecurityAlerts } from "./components/SecurityAlerts";
import { OnboardingWrapper } from "./components/OnboardingWrapper";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let previousUserId: string | undefined;

    // Check auth on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      previousUserId = session?.user?.id;
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id;
        
        // If user changed, clear everything
        if (previousUserId && newUserId && previousUserId !== newUserId) {
          console.log('[Auth] User changed, clearing storage and cache');
          localStorage.clear();
          sessionStorage.clear();
          queryClient.clear();
        }
        
        // Update session
        setSession(session);
        previousUserId = newUserId;
        
        // Handle auth events
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] SIGNED_OUT event, clearing query cache');
          queryClient.clear();
          queryClient.invalidateQueries();
          // Don't redirect here - let AccountMenu handle it
        } else if (event === 'SIGNED_IN') {
          console.log('[Auth] SIGNED_IN event, clearing stale cache');
          queryClient.invalidateQueries();
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
    <OnboardingWrapper>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center justify-between border-b px-4 sticky top-0 bg-background/95 backdrop-blur z-10 gap-4">
              <div className="flex items-center gap-4 flex-1">
                <SidebarTrigger />
                <GlobalSearch />
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <AccountMenu />
              </div>
            </header>
            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/investments" element={<Investments />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/goals" element={<FuturePlanner />} />
                <Route path="/news" element={<News />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
        <SecurityAlerts />
      </SidebarProvider>
    </OnboardingWrapper>
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
                <PWAUpdateNotification />
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
