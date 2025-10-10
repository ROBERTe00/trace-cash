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

export default function Settings() {
  const handleExport = async () => {
    exportToCSV();
    await AuditLogger.logDataExport('csv');
    toast.success("Data exported successfully!");
  };

  const handleLogout = async () => {
    await AuditLogger.log({
      action: 'user_logout',
      resourceType: 'auth',
    });
    await supabase.auth.signOut();
    clearUser();
    window.location.href = '/';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">Security & Compliance</h3>
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
        <h3 className="text-xl font-bold">Data Management</h3>
        <div className="flex gap-4">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
