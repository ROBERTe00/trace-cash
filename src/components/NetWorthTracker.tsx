import { Card } from "@/components/ui/card";
import { Expense, Investment } from "@/lib/storage";
import { TrendingUp, Wallet, PiggyBank, CreditCard } from "lucide-react";

interface NetWorthTrackerProps {
  expenses: Expense[];
  investments: Investment[];
}

export const NetWorthTracker = ({ expenses, investments }: NetWorthTrackerProps) => {
  // Assets
  const cashBalance = expenses
    .reduce((sum, e) => sum + (e.type === "Income" ? e.amount : -e.amount), 0);
  
  const investmentValue = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.currentPrice,
    0
  );

  const totalAssets = cashBalance + investmentValue;

  // Liabilities (assuming negative recurring expenses as debts/loans)
  const monthlyLiabilities = expenses
    .filter((e) => e.type === "Expense" && e.recurrence === "Monthly")
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Worth
  const netWorth = totalAssets;

  const assetAllocation = [
    {
      name: "Cash & Bank",
      value: cashBalance,
      percentage: (cashBalance / totalAssets) * 100,
      icon: Wallet,
      color: "text-blue-500",
    },
    {
      name: "Investments",
      value: investmentValue,
      percentage: (investmentValue / totalAssets) * 100,
      icon: TrendingUp,
      color: "text-green-500",
    },
  ];

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <PiggyBank className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Net Worth Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Total Net Worth</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            €{netWorth.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
          <div className="text-sm text-muted-foreground mb-1">Total Assets</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            €{totalAssets.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
          <div className="text-sm text-muted-foreground mb-1">Monthly Obligations</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            €{monthlyLiabilities.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground">Asset Breakdown</h3>
        {assetAllocation.map((asset) => {
          const Icon = asset.icon;
          return (
            <div
              key={asset.name}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${asset.color}`} />
                <div>
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {asset.percentage.toFixed(1)}% of assets
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">€{asset.value.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Financial Health Tip</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {investmentValue / totalAssets > 0.6
            ? "Great job! You have a strong investment portfolio. Consider diversifying further."
            : investmentValue / totalAssets > 0.3
            ? "You're on the right track. Try to increase your investment allocation gradually."
            : "Consider investing more to grow your wealth. Aim for at least 30% in investments."}
        </p>
      </div>
    </Card>
  );
};
