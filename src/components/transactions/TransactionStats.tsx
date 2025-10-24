import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Hash, PieChart } from "lucide-react";
import { StatNumber } from "@/components/ui/stat-number";

interface TransactionStatsProps {
  totalExpenses: number;
  transactionCount: number;
  topCategory: { name: string; percentage: number } | null;
}

export const TransactionStats = ({
  totalExpenses,
  transactionCount,
  topCategory,
}: TransactionStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Expenses */}
      <Card className="stat-card group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StatNumber value={totalExpenses} size="md" color="default" />
        </CardContent>
      </Card>

      {/* Transaction Count */}
      <Card className="stat-card group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Hash className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-mono">{transactionCount}</div>
        </CardContent>
      </Card>

      {/* Top Category */}
      <Card className="stat-card group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <PieChart className="w-5 h-5 text-success" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {topCategory ? (
            <div className="space-y-1">
              <div className="text-lg font-bold">{topCategory.name}</div>
              <div className="text-sm text-muted-foreground">
                {topCategory.percentage.toFixed(1)}% of spending
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
