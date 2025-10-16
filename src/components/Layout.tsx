import { Moon, Sun, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SettingsPanel } from "@/components/SettingsPanel";
import { NotificationBell } from "@/components/NotificationBell";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FAB } from "@/components/ui/fab";

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export const Layout = ({ children, onLogout }: LayoutProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <span className="text-lg font-bold text-white">€</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent gradient-primary">
              TraceCash
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full relative z-50 hidden md:flex"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <NotificationBell />
            <SettingsPanel />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full relative z-50"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {onLogout && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="rounded-full relative z-50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container px-4 py-6 pb-24 md:pb-6 animate-fade-in">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Floating Action Button */}
      <FAB />
    </div>
  );
};