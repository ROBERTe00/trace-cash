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
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "USD", label: "Dollaro USA", symbol: "$" },
  { value: "GBP", label: "Sterlina Britannica", symbol: "£" },
  { value: "JPY", label: "Yen Giapponese", symbol: "¥" },
  { value: "CHF", label: "Franco Svizzero", symbol: "CHF" },
];

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
];

export function LanguageCurrencySettings() {
  const { currency, language, setCurrency, setLanguage } = useApp();

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    const currencyLabel = currencies.find(c => c.value === newCurrency)?.label;
    toast.success(`Valuta cambiata in ${currencyLabel}`);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    const languageLabel = languages.find(l => l.value === newLanguage)?.label;
    toast.success(`Lingua cambiata in ${languageLabel}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valuta
          </CardTitle>
          <CardDescription>
            Seleziona la valuta per visualizzare i tuoi dati finanziari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="currency">Valuta Predefinita</Label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger id="currency" className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{curr.symbol}</span>
                      <span>{curr.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Tutte le cifre verranno visualizzate nella valuta selezionata
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Lingua
          </CardTitle>
          <CardDescription>
            Scegli la lingua dell'interfaccia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language">Lingua dell'Interfaccia</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
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
            <p className="text-xs text-muted-foreground mt-2">
              L'interfaccia verrà aggiornata con la lingua selezionata
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
