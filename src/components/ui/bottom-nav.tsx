import { Home, Receipt, TrendingUp, Users, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/", exactMatch: true },
    { icon: Receipt, label: "Spese", path: "/expenses" },
    { icon: TrendingUp, label: "Investimenti", path: "/investments" },
    { icon: Users, label: "Community", path: "/community" },
    { icon: Settings, label: "Impostazioni", path: "/settings" },
  ];

  const isActive = (path: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ icon: Icon, label, path, exactMatch }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all duration-200",
              "hover:bg-accent/50 active:scale-95",
              isActive(path, exactMatch)
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
            aria-label={label}
          >
            <Icon className={cn(
              "transition-all duration-200",
              isActive(path, exactMatch) ? "w-6 h-6" : "w-5 h-5"
            )} />
            <span className="text-[10px] leading-none">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
