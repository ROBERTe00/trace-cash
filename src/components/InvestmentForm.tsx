import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Investment } from "@/lib/storage";
import { Plus, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { searchAssets, classifyAsset } from "@/constants/investmentAssets";
import { useLivePrice } from "@/hooks/useLivePrice";

interface InvestmentFormProps {
  onAdd: (investment: Omit<Investment, "id">) => Promise<void> | void;
}

export const InvestmentForm = ({ onAdd }: InvestmentFormProps) => {
  const { t, formatCurrency, currencySymbols, currency } = useApp();
  const [formData, setFormData] = useState<{
    type: Investment["type"];
    name: string;
    currentPrice: string;
    profitPercentage: string;
    quantity: string;
    symbol: string;
    liveTracking: boolean;
  }>({
    type: "" as Investment["type"],
    name: "",
    currentPrice: "",
    profitPercentage: "",
    quantity: "",
    symbol: "",
    liveTracking: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(searchAssets("", 20));
  const [manualEntry, setManualEntry] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { price, loading } = useLivePrice(
    formData.symbol || undefined,
    formData.type,
    formData.liveTracking && formData.symbol !== ""
  );

  useEffect(() => {
    if (price && formData.liveTracking) {
      setFormData(prev => ({
        ...prev,
        currentPrice: price.price.toString()
      }));
    }
  }, [price, formData.liveTracking]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      const filtered = searchAssets(
        searchQuery,
        50,
        formData.type || undefined
      );
      setSuggestions(filtered);
    }, 150);
    return () => clearTimeout(id);
  }, [searchQuery, formData.type]);

  const handleAssetSelect = (asset: any) => {
    setFormData({
      ...formData,
      name: asset.name,
      symbol: asset.symbol,
      type: (asset.type === 'Cash' ? 'Cash' : asset.type) as Investment["type"],
      liveTracking: true
    });
    setSearchQuery(asset.name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name || !formData.currentPrice || !formData.profitPercentage || !formData.quantity) {
      toast.error(t("investment.enterName"));
      return;
    }

    const currentPrice = parseFloat(formData.currentPrice);
    const profitPercentage = parseFloat(formData.profitPercentage);
    const quantity = parseFloat(formData.quantity);
    const purchasePrice = currentPrice / (1 + profitPercentage / 100);

    // Basic numeric validation
    if (!isFinite(currentPrice) || currentPrice <= 0 || !isFinite(quantity) || quantity <= 0 || !isFinite(purchasePrice) || purchasePrice <= 0) {
      toast.error(t("common.invalidData") || "Dati non validi");
      return;
    }

    // Classification and consistency rules
    const detected = classifyAsset(formData.symbol, formData.name);
    // Cash non deve avere symbol/liveTracking
    if (formData.type === 'Cash' && (formData.symbol || formData.liveTracking)) {
      toast.error("Cash non può avere simbolo o live tracking");
      return;
    }
    // Se è presente una classificazione affidabile, usa quella (auto-correct)
    let finalType = formData.type;
    if (detected && finalType && detected !== finalType) {
      finalType = detected;
      toast.info(`Tipo corretto automaticamente a ${detected} sulla base dell'asset selezionato`);
    }
    if (!finalType && detected) {
      finalType = detected;
    }
    if (!finalType) {
      toast.error("Seleziona un tipo valido (Stock/ETF/Crypto/Cash)");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd({
        type: finalType,
        name: formData.name,
        currentPrice,
        purchasePrice,
        quantity,
        symbol: formData.symbol || undefined,
        liveTracking: formData.liveTracking,
      });

      // Reset form only after successful add
      setFormData({
        type: "" as Investment["type"],
        name: "",
        currentPrice: "",
        profitPercentage: "",
        quantity: "",
        symbol: "",
        liveTracking: false,
      });
      setSearchQuery("");
      setManualEntry(false);
    } catch (error) {
      console.error('Error adding investment:', error);
      // Error toast is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card animate-fade-in border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          {t('investment.quickAdd')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('investment.type')}</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Investment["type"] })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stock">{t('investment.typeStock')}</SelectItem>
                  <SelectItem value="ETF">{t('investment.typeETF')}</SelectItem>
                  <SelectItem value="Crypto">{t('investment.typeCrypto')}</SelectItem>
                  <SelectItem value="Cash">{t('investment.typeCash')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('investment.name')} *</Label>
              <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between min-w-0"
                    type="button"
                  >
                    <span className="flex-1 min-w-0 text-left truncate">
                      {searchQuery || formData.name || t("investment.searchAsset")}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-h-72 overflow-auto" align="start">
                  <Command>
                    <CommandInput
                      placeholder={t("investment.searchAsset")}
                      value={searchQuery}
                      onValueChange={handleSearchChange}
                    />
                    <CommandList>
                      <CommandEmpty>{t("investment.enterName")}</CommandEmpty>
                      <CommandGroup>
                        {suggestions.map((asset) => (
                          <CommandItem
                            key={asset.symbol}
                            onSelect={() => handleAssetSelect(asset)}
                            className="flex items-center justify-between cursor-pointer gap-3"
                            title={`${asset.name} (${asset.symbol})`}
                          >
                            <div className="min-w-0">
                              <div className="font-medium truncate">{asset.name}</div>
                              <div className="text-xs text-gray-400 truncate">{asset.symbol} · {asset.type}</div>
                            </div>
                            {price && asset.symbol === formData.symbol && (
                              <Badge variant="outline" className="ml-2">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                                {formatCurrency(price.price)}
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Manual Entry Section */}
              {!manualEntry && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 border-t border-muted"></div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setManualEntry(true)}
                    className="gap-2 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    {t('investment.addCustomAsset')}
                  </Button>
                  <div className="flex-1 border-t border-muted"></div>
                </div>
              )}
              
              {manualEntry && (
                <div className="space-y-3 mt-3 p-3 border rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-xs">{t('investment.assetName')}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., My Custom Stock"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('investment.symbol')} ({t('common.optional')})</Label>
                    <Input
                      value={formData.symbol || ''}
                      onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                      placeholder="e.g., CUSTOM"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setManualEntry(false)}
                    className="w-full text-xs"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {t('investment.currentPrice')} ({currencySymbols[currency]}) *
                {loading && formData.liveTracking && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t("investment.loading")}
                  </Badge>
                )}
                {price && formData.liveTracking && !loading && (
                  <Badge variant="default" className="ml-2 text-xs">
                    {t("investment.livePrice")} 🟢
                  </Badge>
                )}
              </Label>
              <Input 
                type="number" 
                step="0.01" 
                value={formData.currentPrice} 
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })} 
                required 
                disabled={formData.liveTracking && loading}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('investment.profitLoss')} (%) *</Label>
              <Input type="number" step="0.01" value={formData.profitPercentage} onChange={(e) => setFormData({ ...formData, profitPercentage: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>{t('investment.quantity')} *</Label>
              <Input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>{t('investment.symbol')}</Label>
              <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} />
            </div>
          </div>

          {formData.currentPrice && formData.profitPercentage && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('investment.purchasePrice')}: <span className="font-medium">{formatCurrency(parseFloat(formData.currentPrice) / (1 + parseFloat(formData.profitPercentage) / 100))}</span>
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox id="live" checked={formData.liveTracking} onCheckedChange={(checked) => setFormData({ ...formData, liveTracking: checked as boolean })} />
            <Label htmlFor="live" className="text-sm cursor-pointer">{t('investment.liveTracking')}</Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Salvataggio…' : t('investment.addButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
