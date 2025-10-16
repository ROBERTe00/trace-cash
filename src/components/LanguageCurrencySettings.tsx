import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, DollarSign } from "lucide-react";
import { useApp, Currency, Language } from "@/contexts/AppContext";
import { toast } from "sonner";

const currencies: { value: Currency; label: string; symbol: string }[] = [
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
  { value: "JPY", label: "Japanese Yen (¥)", symbol: "¥" },
  { value: "CHF", label: "Swiss Franc (CHF)", symbol: "CHF" },
  { value: "CNY", label: "Chinese Yuan (¥)", symbol: "¥" },
  { value: "AUD", label: "Australian Dollar (A$)", symbol: "A$" },
  { value: "CAD", label: "Canadian Dollar (C$)", symbol: "C$" },
  { value: "BRL", label: "Brazilian Real (R$)", symbol: "R$" },
  { value: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
  { value: "RUB", label: "Russian Ruble (₽)", symbol: "₽" },
  { value: "SEK", label: "Swedish Krona (kr)", symbol: "kr" },
  { value: "NOK", label: "Norwegian Krone (kr)", symbol: "kr" },
  { value: "DKK", label: "Danish Krone (kr)", symbol: "kr" },
  { value: "PLN", label: "Polish Zloty (zł)", symbol: "zł" },
  { value: "MXN", label: "Mexican Peso (Mex$)", symbol: "Mex$" },
  { value: "ZAR", label: "South African Rand (R)", symbol: "R" },
  { value: "SGD", label: "Singapore Dollar (S$)", symbol: "S$" },
  { value: "HKD", label: "Hong Kong Dollar (HK$)", symbol: "HK$" },
  { value: "KRW", label: "South Korean Won (₩)", symbol: "₩" },
  { value: "TRY", label: "Turkish Lira (₺)", symbol: "₺" },
  { value: "AED", label: "UAE Dirham (د.إ)", symbol: "د.إ" },
  { value: "THB", label: "Thai Baht (฿)", symbol: "฿" },
  { value: "IDR", label: "Indonesian Rupiah (Rp)", symbol: "Rp" },
  { value: "MYR", label: "Malaysian Ringgit (RM)", symbol: "RM" },
];

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
];

export function LanguageCurrencySettings() {
  const { currency, language, setCurrency, setLanguage, t } = useApp();

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    const currencyLabel = currencies.find(c => c.value === newCurrency)?.label;
    toast.success(`${t("currency.changed")} ${currencyLabel}`);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    const languageLabel = languages.find(l => l.value === newLanguage)?.label;
    toast.success(`${t("language.changed")} ${languageLabel}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t("currency.default")}
          </CardTitle>
          <CardDescription>
            {t("currency.label")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100] max-h-[300px]">
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t("language.interface")}
          </CardTitle>
          <CardDescription>
            {t("language.label")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="bg-background">
              <SelectValue>
                {language && languages.find(l => l.value === language)?.label}
              </SelectValue>
            </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
