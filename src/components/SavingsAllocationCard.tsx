import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Progress } from "@/components/ui/progress";

interface SavingsAllocationCardProps {
  availableSavings: number;
  savingsRate: number;
  suggestion: string;
  onInvestClick?: () => void;
}

export const SavingsAllocationCard = ({
  availableSavings,
  savingsRate,
  suggestion,
  onInvestClick
}: SavingsAllocationCardProps) => {
  const { formatCurrency } = useApp();
  const investmentThreshold = 200;
  const progressPercent = Math.min((availableSavings / investmentThreshold) * 100, 100);
  const canInvest = availableSavings >= investmentThreshold;

  return (
    <Card className="p-6 hover-lift">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${canInvest ? 'bg-green-500/20' : 'bg-primary/20'}`}>
            <PiggyBank className={`h-6 w-6 ${canInvest ? 'text-green-600' : 'text-primary'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Available Savings</h3>
            <p className="text-xs text-muted-foreground">Ready to invest</p>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <p className={`text-3xl font-bold ${canInvest ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
            {formatCurrency(availableSavings)}
          </p>
          
          {/* Progress to threshold */}
          {!canInvest && (
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(investmentThreshold - availableSavings)} to investment threshold
              </p>
            </div>
          )}
        </div>

        {/* Savings Rate */}
        <div className="flex items-center justify-between py-2 border-t border-border/50">
          <span className="text-sm text-muted-foreground">Savings Rate</span>
          <span className={`text-sm font-semibold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {savingsRate.toFixed(1)}%
          </span>
        </div>

        {/* Suggestion */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">{suggestion}</p>
        </div>

        {/* CTA */}
        {canInvest && onInvestClick && (
          <Button 
            onClick={onInvestClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Allocate to Investments
          </Button>
        )}
      </div>
    </Card>
  );
};