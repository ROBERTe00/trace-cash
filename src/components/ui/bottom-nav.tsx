import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface BottomNavProps {
  items: {
    label: string;
    href: string;
    icon: LucideIcon;
  }[];
  fabAction?: () => void;
  fabIcon?: LucideIcon;
}

export function BottomNav({ items, fabAction, fabIcon: FabIcon }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
        
        {fabAction && FabIcon && (
          <button
            onClick={fabAction}
            className="absolute left-1/2 -translate-x-1/2 -top-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          >
            <FabIcon className="h-6 w-6" />
          </button>
        )}
        
        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
