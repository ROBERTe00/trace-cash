import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, PiggyBank, Wallet, Target, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SummaryStepProps {
  data: any;
}

export function SummaryStep({ data }: SummaryStepProps) {
  const netWorth = data.liquidity + data.assets - data.debts;
  const savingsRate = data.monthlyIncome > 0 
    ? ((data.savingsGoal / data.monthlyIncome) * 100).toFixed(0) 
    : "0";

  const stats = [
    {
      icon: ArrowUpCircle,
      label: "Monthly Income",
      value: `€${data.monthlyIncome.toLocaleString()}`,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Target,
      label: "Savings Goal",
      value: `€${data.savingsGoal.toLocaleString()}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Wallet,
      label: "Net Worth",
      value: `€${netWorth.toLocaleString()}`,
      color: netWorth >= 0 ? "text-success" : "text-destructive",
      bgColor: netWorth >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
    {
      icon: PiggyBank,
      label: "Savings Rate",
      value: `${savingsRate}%`,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Your Financial Profile is Ready</span>
        </div>
        <p className="text-muted-foreground">Here's your personalized overview</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color} truncate-text`}>{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* AI Projections */}
      <Card className="p-5 bg-gradient-to-br from-primary/5 via-purple-500/5 to-secondary/5 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">AI Financial Projections</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">1Y</Badge>
              <div className="flex-1">
                <p className="text-sm">
                  If you maintain your savings goal, you'll accumulate approximately{" "}
                  <span className="font-bold text-success">
                    €{(data.savingsGoal * 12).toLocaleString()}
                  </span>{" "}
                  in 12 months.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">3Y</Badge>
              <div className="flex-1">
                <p className="text-sm">
                  With a conservative 5% annual return on investments, your net worth could reach{" "}
                  <span className="font-bold text-primary">
                    €{(netWorth + data.savingsGoal * 36 * 1.05).toLocaleString()}
                  </span>{" "}
                  in 3 years.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">Tip</Badge>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Consider increasing your savings rate to {parseInt(savingsRate) + 5}% to reach financial goals faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>🎉 Your personalized dashboard is ready!</p>
        <p className="mt-1">Click "Start Using App" to begin tracking your finances.</p>
      </div>
    </div>
  );
}
