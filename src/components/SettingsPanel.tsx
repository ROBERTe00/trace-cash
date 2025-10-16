import { useState } from "react";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useApp, Currency, Language } from "@/contexts/AppContext";
import { clearCacheAndReload } from "@/lib/serviceWorkerUtils";
import { toast } from "sonner";

const currencies: { value: Currency; label: string }[] = [
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
];

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "it", label: "Italiano" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

export const SettingsPanel = () => {
  const { currency, language, setCurrency, setLanguage } = useApp();
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    toast.loading("🔄 Clearing cache...");
    
    // Small delay to show the toast
    setTimeout(async () => {
      await clearCacheAndReload();
    }, 1000);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Currency
          </DropdownMenuLabel>
          {currencies.map((curr) => (
            <DropdownMenuItem
              key={curr.value}
              onClick={() => setCurrency(curr.value as 'EUR' | 'USD' | 'GBP')}
              className={currency === curr.value ? "bg-accent" : ""}
            >
              {curr.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Language
          </DropdownMenuLabel>
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => setLanguage(lang.value as 'en' | 'es' | 'fr')}
              className={language === lang.value ? "bg-accent" : ""}
            >
              {lang.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => setShowClearCacheDialog(true)}
            className="text-destructive"
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Clear Cache & Reload"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cache & Reload?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all cached data and reload the app with the latest version. 
              Any unsaved changes will be lost. This action will happen immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearCache}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? "Clearing..." : "Clear & Reload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
