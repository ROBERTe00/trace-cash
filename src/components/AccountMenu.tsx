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
      await AuditLogger.log({
        action: 'user_logout',
        resourceType: 'auth',
      });
      
      // Wait for signOut to complete before clearing and redirecting
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        toast.error("Errore durante il logout");
        return;
      }
      
      clearUser();
      
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Errore durante il logout");
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt="User avatar" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {userEmail ? getInitials(userEmail) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
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
