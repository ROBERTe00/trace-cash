import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Zap } from "lucide-react";
import { Investment } from "@/lib/storage";

interface InvestmentFormProps {
  onAdd: (investment: Omit<Investment, "id">) => void;
}

export const InvestmentForm = ({ onAdd }: InvestmentFormProps) => {
  const [formData, setFormData] = useState({
    type: "ETF" as Investment["type"],
    name: "",
    quantity: "1",
    currentPrice: "",
    profitPercentage: "",
    symbol: "",
    liveTracking: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.currentPrice ||
      !formData.profitPercentage
    )
      return;

    const currentPrice = parseFloat(formData.currentPrice);
    const profitPercentage = parseFloat(formData.profitPercentage);
    const quantity = parseFloat(formData.quantity);
    
    // Calculate purchase price from current price and profit percentage
    // If +20% profit: purchasePrice = currentPrice / 1.20
    // If -20% loss: purchasePrice = currentPrice / 0.80
    const purchasePrice = currentPrice / (1 + profitPercentage / 100);

    onAdd({
      type: formData.type,
      name: formData.name,
      quantity,
      purchasePrice,
      currentPrice,
      symbol: formData.symbol || undefined,
      liveTracking: formData.liveTracking,
      purchaseDate: new Date().toISOString().split("T")[0],
    });

    setFormData({
      type: "ETF",
      name: "",
      quantity: "1",
      currentPrice: "",
      profitPercentage: "",
      symbol: "",
      liveTracking: false,
    });
  };

  return (
    <Card className="glass-card p-6 animate-fade-in hover-lift border-2 border-primary/10">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
        Quick Add Investment
      </h3>
      <p className="text-sm text-muted-foreground mb-4">Simply enter current price and profit/loss %</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inv-category">Category</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as Investment["type"] })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETF">ETF</SelectItem>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Stock">Stock</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="inv-name">Name *</Label>
            <Input
              id="inv-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., SPY ETF or Bitcoin"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="current-price">Current Price (€) *</Label>
            <Input
              id="current-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.currentPrice}
              onChange={(e) =>
                setFormData({ ...formData, currentPrice: e.target.value })
              }
              placeholder="100.00"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="profit-percentage">Profit/Loss (%) *</Label>
            <Input
              id="profit-percentage"
              type="number"
              step="0.01"
              value={formData.profitPercentage}
              onChange={(e) =>
                setFormData({ ...formData, profitPercentage: e.target.value })
              }
              placeholder="+20 or -15"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="1"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="symbol">Symbol (Optional)</Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              placeholder="e.g., BTC, ETH, SPY"
              className="mt-1"
            />
          </div>
        </div>

        {formData.currentPrice && formData.profitPercentage && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-sm text-muted-foreground">
              📊 Purchase price calculated: <span className="font-bold text-foreground">
                €{(parseFloat(formData.currentPrice) / (1 + parseFloat(formData.profitPercentage) / 100)).toFixed(2)}
              </span>
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Checkbox
            id="live-tracking"
            checked={formData.liveTracking}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, liveTracking: checked as boolean })
            }
          />
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <Label
              htmlFor="live-tracking"
              className="text-sm font-normal cursor-pointer"
            >
              Enable live price tracking for crypto (updates automatically from market)
            </Label>
          </div>
        </div>

        <Button type="submit" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Investment
        </Button>
      </form>
    </Card>
  );
};