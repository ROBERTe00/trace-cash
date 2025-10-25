/**
 * Improved Balance Summary Card
 * Inspired by PDF bank statement format
 * Shows: Initial Balance | Outflows | Inflows | Closing Balance
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/contexts/AppContext";

interface ImprovedBalanceSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  onAddClick: () => void;
  onSearch?: (query: string) => void;
}

export const ImprovedBalanceSummary = ({
  totalIncome,
  totalExpenses,
  onAddClick,
  onSearch,
}: ImprovedBalanceSummaryProps) => {
  const { formatCurrency } = useApp();

  // Calculate balances (simplified for demo, in real app would track over time)
  const closingBalance = totalIncome - totalExpenses;
  const initialBalance = 0; // Would come from previous period
  
  // Calculate expense ratio for progress bar
  const total = totalIncome + totalExpenses;
  const expenseRatio = total > 0 ? (totalExpenses / total) * 100 : 0;

  return (
    <Card className="p-6 glass-card border-0">
      <div className="space-y-4">
        {/* Top Row: Title + Add Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {formatCurrency.length > 0 ? 'Riepilogo del Saldo' : 'Riepilogo del Saldo'}
          </h2>
          <Button onClick={onAddClick} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Aggiungi
          </Button>
        </div>

        {/* Balance Metrics Grid (PDF-style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Initial Balance */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Saldo Iniziale</p>
            <p className="text-lg font-semibold">{formatCurrency(initialBalance)}</p>
          </div>

          {/* Outflows */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Denaro in Uscita
            </p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          {/* Inflows */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Denaro in Entrata
            </p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          {/* Closing Balance */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Saldo di Chiusura</p>
            <p className="text-lg font-semibold text-primary">
              {formatCurrency(closingBalance)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Rapporto Entrate/Uscite</span>
            <span>{expenseRatio.toFixed(1)}% uscite</span>
          </div>
          <Progress value={expenseRatio} className="h-2" />
        </div>

        {/* Search Bar */}
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca transazioni per descrizione..."
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

