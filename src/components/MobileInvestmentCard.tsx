import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Investment } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";

interface MobileInvestmentCardProps {
  investment: Investment;
  onDelete: (id: string) => void;
}

export const MobileInvestmentCard = ({
  investment,
  onDelete,
}: MobileInvestmentCardProps) => {
  const { formatCurrency, t } = useApp();

  const initialValue = investment.quantity * investment.purchasePrice;
  const currentValue = investment.quantity * investment.currentPrice;
  const yieldPercent = ((currentValue - initialValue) / initialValue) * 100;
  const isPositive = yieldPercent >= 0;

  return (
    <Card className="glass-card p-4 space-y-3">
      {/* Header: Name + Type */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{investment.name}</h4>
            {investment.liveTracking && (
              <Badge variant="outline" className="text-xs gap-1">
                <Zap className="h-3 w-3 text-primary" />
                Live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Badge variant="secondary" className="text-xs">
              {investment.type}
            </Badge>
            {investment.symbol && (
              <span className="text-xs">{investment.symbol}</span>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(investment.id)}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("investments.quantity")}</p>
          <p className="font-medium">{investment.quantity}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("investments.currentPrice")}</p>
          <p className="font-medium">{formatCurrency(investment.currentPrice)}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("investments.initialValue")}</p>
          <p className="text-sm">{formatCurrency(initialValue)}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("investments.currentValue")}</p>
          <p className="text-sm font-semibold">{formatCurrency(currentValue)}</p>
        </div>
      </div>

      {/* Yield Badge */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm text-muted-foreground">{t("investments.yield")}</span>
        <div
          className={`flex items-center gap-1 font-semibold ${
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
      </div>
    </Card>
  );
};