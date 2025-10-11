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
import { searchAssets } from "@/constants/investmentAssets";
import { useLivePrice } from "@/hooks/useLivePrice";

interface InvestmentFormProps {
  onAdd: (investment: Omit<Investment, "id">) => void;
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
    type: "Stock",
    name: "",
    currentPrice: "",
    profitPercentage: "",
    quantity: "",
    symbol: "",
    liveTracking: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(searchAssets("", 10));
  
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
    const results = searchAssets(value, 10);
    setSuggestions(results);
  };

  const handleAssetSelect = (asset: any) => {
    setFormData({
      ...formData,
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type as Investment["type"],
      liveTracking: true
    });
    setSearchQuery(asset.name);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.currentPrice || !formData.profitPercentage || !formData.quantity) {
      toast.error(t("investment.enterName"));
      return;
    }

    const currentPrice = parseFloat(formData.currentPrice);
    const profitPercentage = parseFloat(formData.profitPercentage);
    const quantity = parseFloat(formData.quantity);
    const purchasePrice = currentPrice / (1 + profitPercentage / 100);

    onAdd({
      type: formData.type,
      name: formData.name,
      currentPrice,
      purchasePrice,
      quantity,
      symbol: formData.symbol || undefined,
      liveTracking: formData.liveTracking,
    });

    setFormData({
      type: "Stock",
      name: "",
      currentPrice: "",
      profitPercentage: "",
      quantity: "",
      symbol: "",
      liveTracking: false,
    });
    setSearchQuery("");
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stock">Stock</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
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
                    className="w-full justify-between"
                    type="button"
                  >
                    {searchQuery || formData.name || t("investment.searchAsset")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
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
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <strong>{asset.symbol}</strong> - {asset.name}
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

          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {t('investment.addButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
