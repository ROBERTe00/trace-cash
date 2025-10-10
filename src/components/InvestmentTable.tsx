import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, TrendingUp, TrendingDown, Zap, RefreshCw } from "lucide-react";
import { Investment } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import { useState, useEffect } from "react";
import { fetchAllAssetPrices } from "@/lib/marketData";
import { toast } from "sonner";

interface InvestmentTableProps {
  investments: Investment[];
  onDelete: (id: string) => void;
  onUpdatePrice?: (id: string, newPrice: number) => void;
}

export const InvestmentTable = ({
  investments,
  onDelete,
  onUpdatePrice,
}: InvestmentTableProps) => {
  const { formatCurrency } = useApp();
  const [updating, setUpdating] = useState(false);

  const updateLivePrices = async () => {
    setUpdating(true);
    const liveInvestments = investments.filter(inv => inv.liveTracking && inv.symbol);
    
    if (liveInvestments.length === 0) {
      setUpdating(false);
      return;
    }

    const prices = await fetchAllAssetPrices(
      liveInvestments.map((inv) => ({ symbol: inv.symbol!, category: inv.type }))
    );

    let updated = 0;
    for (const inv of liveInvestments) {
      if (inv.symbol && prices[inv.symbol.toUpperCase()] && onUpdatePrice) {
        onUpdatePrice(inv.id, prices[inv.symbol.toUpperCase()].price);
        updated++;
      }
    }
    
    setUpdating(false);
    if (updated > 0) {
      toast.success(`Updated ${updated} asset${updated !== 1 ? "s" : ""}!`);
    }
  };

  useEffect(() => {
    const hasLiveTracking = investments.some(inv => inv.liveTracking && inv.symbol);
    if (hasLiveTracking) {
      updateLivePrices();
      const interval = setInterval(updateLivePrices, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [investments.length]);
  const calculateYield = (investment: Investment) => {
    const initial = investment.quantity * investment.purchasePrice;
    const current = investment.quantity * investment.currentPrice;
    return ((current - initial) / initial) * 100;
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Investment Portfolio</h3>
        {investments.some(inv => inv.liveTracking) && (
          <Button
            variant="outline"
            size="sm"
            onClick={updateLivePrices}
            disabled={updating}
            className="gap-2"
          >
            <Zap className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Sync All Prices
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Initial Value</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Yield %</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No investments yet
                </TableCell>
              </TableRow>
            ) : (
              investments.map((investment) => {
                const initialValue = investment.quantity * investment.purchasePrice;
                const currentValue = investment.quantity * investment.currentPrice;
                const yieldPercent = calculateYield(investment);
                const isPositive = yieldPercent >= 0;

                return (
                  <TableRow key={investment.id}>
                    <TableCell>{investment.type}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {investment.name}
                        {investment.liveTracking && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Zap className="h-3 w-3 text-primary" />
                            Live
                          </Badge>
                        )}
                      </div>
                      {investment.symbol && (
                        <div className="text-xs text-muted-foreground">{investment.symbol}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {investment.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(investment.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(investment.currentPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(initialValue)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(currentValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={`flex items-center justify-end gap-1 ${
                          isPositive ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {yieldPercent.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(investment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};