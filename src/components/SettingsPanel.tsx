import { Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const handleClearCache = async () => {
    toast.loading("Clearing cache...");
    await clearCacheAndReload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <DropdownMenuLabel>Currency</DropdownMenuLabel>
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.value}
            onClick={() => setCurrency(curr.value)}
            className={currency === curr.value ? "bg-accent" : ""}
          >
            {curr.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className={language === lang.value ? "bg-accent" : ""}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Advanced</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleClearCache} className="text-warning">
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear Cache & Reload
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
