import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { HorizontalNav } from "@/components/HorizontalNav";
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
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
import { Session } from "@supabase/supabase-js";
import { LoadingDashboard } from "@/components/LoadingDashboard";
import Index from "./pages/Index";
import DashboardHome from "./pages/DashboardHome";
import Goals from "./pages/Goals";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Investments from "./pages/Investments";
import Insights from "./pages/Insights";
import FuturePlanner from "./pages/FuturePlanner";
import News from "./pages/News";
import Settings from "./pages/Settings";
import CreditCardIntegration from "./pages/CreditCardIntegration";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AIEducator from "./pages/AIEducator";
import { SecurityAlerts } from "./components/SecurityAlerts";
import { OnboardingWrapper } from "./components/OnboardingWrapper";
import { StateProvider } from "./providers/StateProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('[React Query] Query error:', error);
      },
    },
    mutations: {
      onError: (error) => {
        console.error('[React Query] Mutation error:', error);
      },
    },
  },
});

function ProtectedRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('[ProtectedRoutes] Rendering, loading:', loading, 'session:', !!session);
  
  // Enable real-time sync for expenses and investments
  try {
    useRealTimeSync();
  } catch (error) {
    console.error('[ProtectedRoutes] Error in useRealTimeSync:', error);
  }

  useEffect(() => {
    let previousUserId: string | undefined;
    let mounted = true;

    // Check auth on mount con timeout e error handling
    const checkAuth = async () => {
      try {
        // First check for local auth (offline mode)
        const isOfflineMode = localStorage.getItem('trace-cash-offline-mode') === 'true';
        if (isOfflineMode) {
          const { localAuth } = await import("@/lib/localAuth");
          const localSession = localAuth.getSession();
          
          if (localSession) {
            console.log('[Auth] Found local session (offline mode)');
            const mockSession = localAuth.createMockSession(localSession);
            setSession(mockSession as any);
            previousUserId = mockSession.user.id;
            setLoading(false);
            return;
          } else {
            // Clear offline mode flag if session expired
            localStorage.removeItem('trace-cash-offline-mode');
            localStorage.removeItem('trace-cash-local-user');
          }
        }

        // Try Supabase
        // Timeout di 5 secondi per evitare che rimanga bloccato
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }, error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: { message: 'Auth check timeout' } }), 5000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (!mounted) return;

        if (result.error) {
          console.error('[Auth] Error getting session:', result.error);
          
          // If network error, check if we have local auth
          if (result.error.message?.includes('Failed to fetch') || 
              result.error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
              result.error.name === 'NetworkError') {
            
            const { localAuth } = await import("@/lib/localAuth");
            const localSession = localAuth.getSession();
            
            if (localSession) {
              console.log('[Auth] Using local session as fallback');
              const mockSession = localAuth.createMockSession(localSession);
              setSession(mockSession as any);
              previousUserId = mockSession.user.id;
              setLoading(false);
              return;
            }
          }
          
          // If getSession fails but we're waiting for onAuthStateChange to fire SIGNED_IN,
          // don't immediately set session to null - give onAuthStateChange a chance
          console.log('[Auth] getSession failed, but onAuthStateChange may set session soon');
          // onAuthStateChange will handle setting the session if SIGNED_IN fires
          // Don't set loading to false yet - let onAuthStateChange handle it
          // If onAuthStateChange doesn't fire within 3 seconds, then set loading to false
          setTimeout(() => {
            if (mounted) {
              console.log('[Auth] Timeout: getSession failed and onAuthStateChange check complete');
              setLoading(false);
            }
          }, 3000);
          return;
        }

        const { session } = result.data;
        if (session) {
          // Clear offline mode if Supabase session exists
          localStorage.removeItem('trace-cash-offline-mode');
          localStorage.removeItem('trace-cash-local-user');
        }
        
        setSession(session);
        previousUserId = session?.user?.id;
        setLoading(false);
      } catch (error: any) {
        if (!mounted) return;
        console.error('[Auth] Auth check failed:', error);
        
        // Gestisci errori di rete - try local auth
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            error?.name === 'NetworkError') {
          
          try {
            const { localAuth } = await import("@/lib/localAuth");
            const localSession = localAuth.getSession();
            
            if (localSession) {
              console.log('[Auth] Using local session after error');
              const mockSession = localAuth.createMockSession(localSession);
              setSession(mockSession as any);
              previousUserId = mockSession.user.id;
              setLoading(false);
              return;
            }
          } catch (localError) {
            console.error('[Auth] Local auth check failed:', localError);
          }
        }
        
        setSession(null);
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('[Auth] Auth state change event:', event, 'hasSession:', !!session, 'userId:', session?.user?.id);

        const newUserId = session?.user?.id;
        
        // If user changed, clear everything
        if (previousUserId && newUserId && previousUserId !== newUserId) {
          console.log('[Auth] User changed, clearing storage and cache');
          localStorage.clear();
          sessionStorage.clear();
          queryClient.clear();
        }
        
        // Update session - IMPORTANT: Always set session when SIGNED_IN event fires
        if (event === 'SIGNED_IN' && session) {
          console.log('[Auth] SIGNED_IN - Setting session immediately');
          console.log('[Auth] Session details:', {
            userId: session.user?.id,
            email: session.user?.email,
            accessToken: session.access_token ? 'present' : 'missing'
          });
          setSession(session);
          previousUserId = newUserId;
          setLoading(false);
          
          // Refresh queries
          queryClient.clear();
          queryClient.invalidateQueries();
          
          // If we're on /auth page, redirect to home
          if (window.location.pathname === '/auth') {
            console.log('[Auth] On /auth page, redirecting to home after SIGNED_IN');
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] SIGNED_OUT event, clearing session and cache');
          setSession(null);
          previousUserId = undefined;
          queryClient.clear();
          queryClient.invalidateQueries();
          setLoading(false);
          // Don't redirect here - let AccountMenu handle it
        } else {
          // For other events (TOKEN_REFRESHED, etc.)
          setSession(session);
          previousUserId = newUserId;
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log('[ProtectedRoutes] Before render check - loading:', loading, 'session:', !!session, 'sessionUserId:', session?.user?.id);

  if (loading) {
    console.log('[ProtectedRoutes] Showing loading dashboard');
    return <LoadingDashboard />;
  }

  if (!session) {
    console.log('[ProtectedRoutes] No session, redirecting to /auth');
    // Add small delay to avoid redirect loops
    setTimeout(() => {
      if (!session) {
        window.location.href = '/auth';
      }
    }, 100);
    return <LoadingDashboard />;
  }

  console.log('[ProtectedRoutes] ✅ Session confirmed, rendering dashboard');

  console.log('[ProtectedRoutes] Rendering main content with OnboardingWrapper');
  
  return (
    <OnboardingWrapper>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {(() => {
            try {
              console.log('[ProtectedRoutes] Rendering AppSidebar');
              return <AppSidebar />;
            } catch (error) {
              console.error('[ProtectedRoutes] Error rendering AppSidebar:', error);
              return <div className="w-64 bg-muted p-4">Sidebar Error</div>;
            }
          })()}
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
              {(() => {
                try {
                  console.log('[ProtectedRoutes] Rendering Routes');
                  return (
                    <Routes>
                      <Route path="/" element={<DashboardHome />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/goals" element={<Goals />} />
                      <Route path="/investments" element={<Investments />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/ai-educator" element={<AIEducator />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/credit-cards" element={<CreditCardIntegration />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  );
                } catch (error) {
                  console.error('[ProtectedRoutes] Error rendering Routes:', error);
                  return <div className="p-4 text-destructive">Error loading routes</div>;
                }
              })()}
            </main>
          </div>
        </div>
        <SecurityAlerts />
      </SidebarProvider>
    </OnboardingWrapper>
  );
}

function App() {
  console.log('[App] Component rendering');
  
  // Initialize PWA features (ONE TIME ONLY)
  useEffect(() => {
    console.log('[PWA] Initializing PWA features...');
    
    // Register service worker WITHOUT reload logic
    registerServiceWorker().then(registration => {
      if (registration) {
        console.log('[PWA] Service Worker registered successfully');
      }
    });

    // Capture install prompt
    captureInstallPrompt();
  }, []); // Empty deps = run ONCE

  console.log('[App] Rendering main App structure');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <StateProvider>
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
                      {(() => {
                        console.log('[App] Rendering BrowserRouter and Routes');
                        return (
                          <Routes>
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/*" element={<ProtectedRoutes />} />
                          </Routes>
                        );
                      })()}
                    </BrowserRouter>
                  </TooltipProvider>
                </UploadProvider>
              </AppProvider>
            </ThemeProvider>
          </StateProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
