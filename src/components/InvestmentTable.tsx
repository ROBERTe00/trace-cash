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
import { Trash2, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Investment } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import { useState, useEffect } from "react";
import { fetchAllAssetPrices } from "@/lib/marketData";
import { toast } from "sonner";
import { MobileInvestmentCard } from "@/components/MobileInvestmentCard";

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
  const { formatCurrency, t } = useApp();
  const [updating, setUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateLivePrices = async () => {
    setUpdating(true);
    const liveInvestments = investments.filter(inv => inv.liveTracking && inv.symbol);
    
    if (liveInvestments.length === 0) {
      setUpdating(false);
      return;
    }

    const prices = await fetchAllAssetPrices(
      liveInvestments.map((inv) => ({ symbol: inv.symbol!, type: inv.type }))
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
      toast.success(t("pricesUpdated").replace("{count}", updated.toString()));
    }
  };

  useEffect(() => {
    const hasLiveTracking = investments.some(inv => inv.liveTracking && inv.symbol);
    if (hasLiveTracking) {
      updateLivePrices();
      const interval = setInterval(updateLivePrices, 60000);
      return () => clearInterval(interval);
    }
  }, [investments.length]);

  const calculateYield = (investment: Investment) => {
    const initial = investment.quantity * investment.purchasePrice;
    const current = investment.quantity * investment.currentPrice;
    return ((current - initial) / initial) * 100;
  };

  // Mobile View
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('investments.portfolio')}</h3>
          {investments.some(inv => inv.liveTracking) && (
            <Button
              variant="outline"
              size="sm"
              onClick={updateLivePrices}
              disabled={updating}
              className="gap-2"
            >
              <Zap className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              {t('investments.syncPrices')}
            </Button>
          )}
        </div>
        
        {investments.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <p className="text-muted-foreground">{t('investments.noInvestments')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {investments.map((investment) => (
              <MobileInvestmentCard
                key={investment.id}
                investment={investment}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop View
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('investments.portfolio')}</h3>
        {investments.some(inv => inv.liveTracking) && (
          <Button
            variant="outline"
            size="sm"
            onClick={updateLivePrices}
            disabled={updating}
            className="gap-2"
          >
            <Zap className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            {t('investments.syncPrices')}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('investments.category')}</TableHead>
              <TableHead>{t('investments.name')}</TableHead>
              <TableHead className="text-right">{t('investments.quantity')}</TableHead>
              <TableHead className="text-right">{t('investments.purchasePrice')}</TableHead>
              <TableHead className="text-right">{t('investments.currentPrice')}</TableHead>
              <TableHead className="text-right">{t('investments.initialValue')}</TableHead>
              <TableHead className="text-right">{t('investments.currentValue')}</TableHead>
              <TableHead className="text-right">{t('investments.yield')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                >
                  {t('investments.noInvestments')}
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