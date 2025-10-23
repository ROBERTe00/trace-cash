import { Card } from "@/components/ui/card";
import { TrendingUp, CreditCard, PieChart } from "lucide-react";

interface TransactionStatsProps {
  totalExpenses: number;
  transactionCount: number;
  topCategory: { name: string; percentage: number };
}

export const TransactionStats = ({ totalExpenses, transactionCount, topCategory }: TransactionStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-5 bg-card border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold font-mono">${totalExpenses.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-card border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold font-mono">{transactionCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-card border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <PieChart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Category</p>
            <p className="text-lg font-bold">{topCategory.name}</p>
            <p className="text-sm text-primary font-mono">{topCategory.percentage}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
