import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Investment } from "@/lib/storage";

interface InvestmentFormProps {
  onAdd: (investment: Omit<Investment, "id">) => void;
}

export const InvestmentForm = ({ onAdd }: InvestmentFormProps) => {
  const [formData, setFormData] = useState({
    category: "ETF" as Investment["category"],
    name: "",
    quantity: "",
    purchasePrice: "",
    currentPrice: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.quantity ||
      !formData.purchasePrice ||
      !formData.currentPrice
    )
      return;

    onAdd({
      category: formData.category,
      name: formData.name,
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: parseFloat(formData.currentPrice),
    });

    setFormData({
      category: "ETF",
      name: "",
      quantity: "",
      purchasePrice: "",
      currentPrice: "",
    });
  };

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Add Investment</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inv-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as Investment["category"] })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETF">ETF</SelectItem>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Stocks">Stocks</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="inv-name">Name</Label>
            <Input
              id="inv-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., SPY ETF or Bitcoin"
              className="mt-1"
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
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="purchase-price">Purchase Price (€)</Label>
            <Input
              id="purchase-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={(e) =>
                setFormData({ ...formData, purchasePrice: e.target.value })
              }
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="current-price">Current Price (€)</Label>
            <Input
              id="current-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.currentPrice}
              onChange={(e) =>
                setFormData({ ...formData, currentPrice: e.target.value })
              }
              placeholder="0.00"
              className="mt-1"
            />
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