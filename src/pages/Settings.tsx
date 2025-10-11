import { SettingsPanel } from "@/components/SettingsPanel";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { MFASetup } from "@/components/MFASetup";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { OfflineModeToggle } from "@/components/OfflineModeToggle";
import { ComplianceBadges } from "@/components/ComplianceBadges";
import { CategoryManager } from "@/components/CategoryManager";
import { NotificationSettings } from "@/components/NotificationSettings";
import { LanguageCurrencySettings } from "@/components/LanguageCurrencySettings";
import { Button } from "@/components/ui/button";
import { clearUser, exportToCSV } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { Download, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AuditLogger } from "@/lib/auditLogger";
import { useApp } from "@/contexts/AppContext";

export default function Settings() {
  const { t } = useApp();
  
  const handleExport = async () => {
    exportToCSV();
    await AuditLogger.logDataExport('csv');
    toast.success(t("exportSuccess"));
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">{t("settings")}</h1>
          <p className="text-muted-foreground">{t("managePreferences")}</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">{t("securityCompliance")}</h3>
        <ComplianceBadges />
      </div>

      <LanguageCurrencySettings />

      <ThemeSwitcher />

      <MFASetup />

      <CategoryManager />

      <NotificationSettings />

      <OfflineModeToggle />

      <AuditLogViewer />

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-xl font-bold">{t("dataManagement")}</h3>
        <div className="flex gap-4">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t("exportData")}
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
