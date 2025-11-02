import { useState, useEffect } from "react";
import { User, LogOut, Settings, HelpCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { clearUser } from "@/lib/storage";
import { AuditLogger } from "@/lib/auditLogger";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { clearCacheAndReload } from "@/lib/pwaUtils";

export const AccountMenu = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('[Logout] Starting logout process...');
      
      // Check if in offline mode
      const isOfflineMode = localStorage.getItem('trace-cash-offline-mode') === 'true';
      
      if (isOfflineMode) {
        // Local auth logout
        const { localAuth } = await import("@/lib/localAuth");
        localAuth.signOut();
        localStorage.removeItem('trace-cash-offline-mode');
        localStorage.removeItem('trace-cash-local-user');
        console.log('[Logout] Local auth logout successful');
      } else {
        // Try Supabase logout (may fail if network is down)
        try {
          await AuditLogger.log({
            action: 'user_logout',
            resourceType: 'auth',
          });
          
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.warn('[Logout] Supabase signOut error (non-critical):', error);
          } else {
            console.log('[Logout] Supabase signOut successful');
          }
        } catch (supabaseError) {
          console.warn('[Logout] Supabase logout failed (network may be down):', supabaseError);
        }
      }
      
      // Clear all user data
      clearUser();
      localStorage.removeItem('trace-cash-offline-mode');
      localStorage.removeItem('trace-cash-local-user');
      sessionStorage.clear();
      
      console.log('[Logout] Storage cleared, calling clearCacheAndReload...');
      
      // Clear cache, unregister SW, and hard reload
      await clearCacheAndReload();
      
    } catch (error) {
      console.error('[Logout] Unexpected error:', error);
      toast.error("Errore durante il logout");
      // Fallback: force redirect even if something fails
      window.location.href = '/auth';
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full z-50">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt="User avatar" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {userEmail ? getInitials(userEmail) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover z-[100]" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t("myAccount")}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>{t("settings")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://docs.lovable.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>{t("documentation")}</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://discord.com/channels/1119885301872070706/1280461670979993613"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>{t("help")}</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
