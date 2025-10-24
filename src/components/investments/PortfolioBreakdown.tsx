import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Investment } from "@/lib/storage";

interface PortfolioBreakdownProps {
  investments: Investment[];
}

export const PortfolioBreakdown = ({ investments }: PortfolioBreakdownProps) => {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="text-card-title">Portfolio Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {investments.map((inv) => {
          const gainPercent = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
          const totalValue = inv.quantity * inv.currentPrice;
          const isPositive = gainPercent >= 0;

          return (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-neon-purple"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">{inv.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {inv.quantity} × ${inv.currentPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? "text-success neon-text-green" : "text-destructive"
                  }`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {gainPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
