import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

interface NetWorthSummaryProps {
  totalValue: number;
  expenses: number;
  investments: number;
  trend: 'up' | 'down' | 'neutral';
  onConnectBroker?: () => void;
  hasInvestments: boolean;
}

export const NetWorthSummary = ({
  totalValue,
  expenses,
  investments,
  trend,
  onConnectBroker,
  hasInvestments
}: NetWorthSummaryProps) => {
  const { formatCurrency } = useApp();
  const isPositive = totalValue >= 0;

  return (
    <Card className={`p-6 md:p-8 bg-gradient-to-br ${isPositive ? 'from-primary/5 to-primary/10' : 'from-destructive/5 to-destructive/10'} border-2 hover-lift`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${isPositive ? 'bg-primary/20' : 'bg-destructive/20'}`}>
              <Wallet className={`h-6 w-6 ${isPositive ? 'text-primary' : 'text-destructive'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Net Worth</p>
              <p className="text-xs text-muted-foreground">All assets and liabilities</p>
            </div>
          </div>
          
          {trend !== 'neutral' && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-xs font-semibold">
                {trend === 'up' ? 'Growing' : 'Declining'}
              </span>
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="space-y-2">
          <h2 className={`text-4xl md:text-5xl font-bold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(totalValue)}
          </h2>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Investments</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              +{formatCurrency(investments)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Expenses (30d)</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              -{formatCurrency(expenses)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Net Balance</p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-foreground' : 'text-destructive'}`}>
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        {/* CTA - Only show if no investments */}
        {!hasInvestments && onConnectBroker && (
          <Button 
            onClick={onConnectBroker}
            className="w-full mt-4 bg-primary hover:bg-primary/90"
            size="lg"
          >
            Connect Broker Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </Card>
  );
};