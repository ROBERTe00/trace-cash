import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAOfflineIndicator } from "@/components/PWAOfflineIndicator";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { Home, Wallet, TrendingUp, Users, Settings, Plus } from "lucide-react";
import WaveBackground from "@/components/WaveBackground";

export const Layout = () => {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Spese", href: "/expenses", icon: Wallet },
    { label: "Investi", href: "/investments", icon: TrendingUp },
    { label: "Community", href: "/community", icon: Users },
    { label: "Profilo", href: "/settings", icon: Settings },
  ];

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
          toast.info("You have been logged out");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SidebarProvider>
      <WaveBackground variant="default" />
      <div className="flex min-h-screen w-full relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <main className="flex-1 w-full overflow-x-hidden overflow-y-auto pb-20 md:pb-0">
          <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 border-b px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <GlobalSearch />
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <NotificationBell />
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
            <PWAInstallPrompt />
            <PWAOfflineIndicator />
            <PWAUpdateNotification />
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Nav with FAB */}
        <BottomNav
          items={navItems}
          fabAction={() => setShowAddDialog(true)}
          fabIcon={Plus}
        />
      </div>
    </SidebarProvider>
  );
};
