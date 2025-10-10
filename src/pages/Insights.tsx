import { useState, useEffect } from "react";
import { InsightsPanel } from "@/components/InsightsPanel";
import { FinancialHealthScore } from "@/components/FinancialHealthScore";
import { NetWorthTracker } from "@/components/NetWorthTracker";
import { EmergencyFundTracker } from "@/components/EmergencyFundTracker";
import { RecurringExpenses } from "@/components/RecurringExpenses";
import { getExpenses, getInvestments } from "@/lib/storage";

export default function Insights() {
  const [expenses, setExpenses] = useState(getExpenses());
  const [investments, setInvestments] = useState(getInvestments());

  useEffect(() => {
    const interval = setInterval(() => {
      setExpenses(getExpenses());
      setInvestments(getInvestments());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Insights</h1>
          <p className="text-muted-foreground">Smart financial recommendations</p>
        </div>
      </div>

      <InsightsPanel investments={investments} expenses={expenses} />

      <FinancialHealthScore expenses={expenses} investments={investments} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetWorthTracker expenses={expenses} investments={investments} />
        </div>
        <EmergencyFundTracker expenses={expenses} />
      </div>

      <RecurringExpenses expenses={expenses} />
    </div>
  );
}
