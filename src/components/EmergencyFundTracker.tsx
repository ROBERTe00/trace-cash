import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Expense } from "@/lib/storage";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface EmergencyFundTrackerProps {
  expenses: Expense[];
}

export const EmergencyFundTracker = ({ expenses }: EmergencyFundTrackerProps) => {
  const monthlyExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const avgMonthlyExpenses = monthlyExpenses / Math.max(1, expenses.filter(e => e.type === "Expense").length) * 30;

  const currentCash = expenses.reduce(
    (sum, e) => sum + (e.type === "Income" ? e.amount : -e.amount),
    0
  );

  // Recommended: 3-6 months of expenses
  const recommendedMin = avgMonthlyExpenses * 3;
  const recommendedMax = avgMonthlyExpenses * 6;

  const monthsCovered = avgMonthlyExpenses > 0 ? currentCash / avgMonthlyExpenses : 0;
  const progressToMin = (currentCash / recommendedMin) * 100;

  const getStatus = () => {
    if (monthsCovered >= 6) return { label: "Excellent", icon: CheckCircle, color: "text-green-500" };
    if (monthsCovered >= 3) return { label: "Good", icon: Shield, color: "text-blue-500" };
    return { label: "Build More", icon: AlertTriangle, color: "text-orange-500" };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Emergency Fund</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Current Fund</span>
          <span className="text-2xl font-bold">€{currentCash.toFixed(0)}</span>
        </div>
        <Progress value={Math.min(progressToMin, 100)} className="h-3 mb-1" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progressToMin.toFixed(0)}% of minimum target</span>
          <span>€{recommendedMin.toFixed(0)} target</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1">Months Covered</div>
          <div className="text-xl font-bold">{monthsCovered.toFixed(1)}</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1">Monthly Need</div>
          <div className="text-xl font-bold">€{avgMonthlyExpenses.toFixed(0)}</div>
        </div>
      </div>

      <div className={`flex items-center gap-2 p-3 rounded-lg ${
        monthsCovered >= 6 ? "bg-green-500/10" : monthsCovered >= 3 ? "bg-blue-500/10" : "bg-orange-500/10"
      }`}>
        <StatusIcon className={`h-5 w-5 ${status.color}`} />
        <div>
          <div className="font-semibold">{status.label}</div>
          <div className="text-xs text-muted-foreground">
            {monthsCovered >= 6
              ? "Your emergency fund is well-established"
              : monthsCovered >= 3
              ? "You have a solid emergency fund"
              : `Save €${(recommendedMin - currentCash).toFixed(0)} more to reach 3 months`}
          </div>
        </div>
      </div>
    </Card>
  );
};
