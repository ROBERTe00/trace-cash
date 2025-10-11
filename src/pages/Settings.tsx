import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { MFASetup } from "@/components/MFASetup";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { OfflineModeToggle } from "@/components/OfflineModeToggle";
import { ComplianceBadges } from "@/components/ComplianceBadges";
import { CategoryManager } from "@/components/CategoryManager";
import { NotificationSettings } from "@/components/NotificationSettings";
import { LanguageCurrencySettings } from "@/components/LanguageCurrencySettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clearUser, exportToCSV } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { Download, LogOut, Palette, Shield, Database, WifiOff, Settings as SettingsIcon } from "lucide-react";
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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        toast.error(t("logoutError"));
        return;
      }
      
      clearUser();
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(t("logoutError"));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">{t("settings")}</h1>
              <p className="text-muted-foreground mt-1">{t("managePreferences")}</p>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger 
            value="appearance" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t("settings.appearance")}
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="security" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("settings.security")}
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="data" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("settings.data")}
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="offline" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              {t("settings.offline")}
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>{t("settings.appearance")}</CardTitle>
              </div>
              <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LanguageCurrencySettings />
              <ThemeSwitcher />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>{t("settings.security")}</CardTitle>
              </div>
              <CardDescription>{t("settings.securityDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ComplianceBadges />
              <MFASetup />
              <AuditLogViewer />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Privacy Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>{t("settings.data")}</CardTitle>
              </div>
              <CardDescription>{t("settings.dataDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CategoryManager />
              <NotificationSettings />
              
              {/* Data Management Actions */}
              <div className="pt-6 border-t space-y-4">
                <h4 className="font-semibold">{t("settings.data")}</h4>
                <div className="flex flex-wrap gap-3">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline Mode Tab */}
        <TabsContent value="offline" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-primary" />
                <CardTitle>{t("settings.offline")}</CardTitle>
              </div>
              <CardDescription>{t("settings.offlineDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <OfflineModeToggle />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}