import { Moon, Sun, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SettingsPanel } from "@/components/SettingsPanel";

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export const Layout = ({ children, onLogout }: LayoutProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
              MyFinance Tracker
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/'}
              className="rounded-full relative z-50"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
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
      
      <main className="container px-4 py-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
};