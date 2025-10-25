/**
 * Transaction Balance Summary Card
 * Shows total balance, income/expense breakdown with progress bar
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";

interface TransactionBalanceSummaryProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  onAddTransaction: () => void;
  onImport: () => void;
}

export const TransactionBalanceSummary = ({
  totalBalance,
  totalIncome,
  totalExpenses,
  onAddTransaction,
  onImport,
}: TransactionBalanceSummaryProps) => {
  const { formatCurrency } = useApp();

  // Calculate percentage for progress bar
  const total = totalIncome + totalExpenses;
  const expensePercentage = total > 0 ? (totalExpenses / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 glass-card border-0 hover-lift">
        <div className="space-y-4">
          {/* Header with Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-muted-foreground">Saldo Totale</h2>
              <p className="text-4xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={onAddTransaction}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Aggiungi</span>
              </Button>
              <Button
                onClick={onImport}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Importa</span>
              </Button>
            </div>
          </div>

          {/* Income/Expense Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">
                ↑ Entrate: {formatCurrency(totalIncome)}
              </span>
              <span className="text-red-600 font-medium">
                ↓ Spese: {formatCurrency(totalExpenses)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <Progress value={expensePercentage} className="h-3" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white drop-shadow-lg">
                  {expensePercentage.toFixed(0)}% speso
                </span>
              </div>
            </div>

            {/* Net Balance */}
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Bilancio Netto:</span>
              <span className={`font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

