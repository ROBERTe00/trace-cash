import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Investment } from "@/lib/storage";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

interface InvestmentFormProps {
  onAdd: (investment: Omit<Investment, "id">) => void;
}

export const InvestmentForm = ({ onAdd }: InvestmentFormProps) => {
  const { t, formatCurrency, currencySymbols, currency } = useApp();
  const [formData, setFormData] = useState({
    type: "Stocks",
    name: "",
    currentPrice: "",
    profitPercentage: "",
    quantity: "",
    symbol: "",
    liveTracking: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.currentPrice || !formData.profitPercentage || !formData.quantity) {
      toast.error("Compila tutti i campi");
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
      type: "Stocks",
      name: "",
      currentPrice: "",
      profitPercentage: "",
      quantity: "",
      symbol: "",
      liveTracking: false,
    });
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
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stocks">Stocks</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Bonds">Bonds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('investment.name')} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('investment.currentPrice')} ({currencySymbols[currency]}) *</Label>
              <Input type="number" step="0.01" value={formData.currentPrice} onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })} required />
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
              <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} />
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
