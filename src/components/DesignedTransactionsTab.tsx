/**
 * Designed Transactions Tab - Following Exact Design Spec
 * Modern minimalist fintech style with brand colors
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Plus, 
  Wallet, 
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Home,
  Coins
} from "lucide-react";
import { motion } from "framer-motion";
import { Expense } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";

interface DesignedTransactionsTabProps {
  transactions: Expense[];
  totalExpenses: number;
  budget: number;
  budgetUsedPercentage: number;
  topCategory: { name: string; amount: number };
  categoryBreakdown: Array<{ name: string; amount: number; percentage: number }>;
  onSearch: (query: string) => void;
  onAddTransaction: () => void;
  onEditBudget: () => void;
}

// Category icons mapping
const categoryIcons: Record<string, any> = {
  'Investment': Coins,
  'Entertainment': TrendingUp,
  'Rent': Home,
  'Shopping': ShoppingBag,
  'Food & Dining': Wallet,
  'Transportation': CreditCard,
};

export const DesignedTransactionsTab = ({
  transactions,
  totalExpenses,
  budget,
  budgetUsedPercentage,
  topCategory,
  categoryBreakdown,
  onSearch,
  onAddTransaction,
  onEditBudget,
}: DesignedTransactionsTabProps) => {
  const { t, formatCurrency } = useApp();
  const budgetExceeded = totalExpenses > budget;
  const trend = "+224,5%"; // Calculate from real data
  const remaining = Math.max(0, budget - totalExpenses);

  return (
    <div className="min-h-screen bg-background">
      {/* 1. STICKY HEADER with Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4 lg:p-6 flex items-center gap-4">
        <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder={t('search.placeholder')}
          onChange={(e) => onSearch(e.target.value)}
          className="flex-1 border-0 bg-muted/50 focus:bg-muted rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E88FF]"
        />
        <Button
          onClick={onAddTransaction}
          className="bg-[#1E88FF] hover:bg-[#1E88FF]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {/* 2. BUDGET ALERT BANNER (conditional) */}
      {budgetExceeded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 lg:mx-6 mt-4 p-4 bg-[#FF4D4F]/10 border border-[#FF4D4F]/20 rounded-xl flex items-center justify-between gap-4 flex-wrap"
        >
          <p className="text-sm font-medium text-[#FF4D4F]">
            ⚠️ {t('budget.exceeded')} {formatCurrency(totalExpenses)} {t('budget.on')} {formatCurrency(budget)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditBudget}
            className="text-[#FF4D4F] hover:bg-[#FF4D4F]/10 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            {t('budget.modify')}
          </Button>
        </motion.div>
      )}

      {/* 3. METRIC CARDS GRID (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 lg:px-6 mt-6">
        {/* Card A: Total Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#1E88FF]" />
                <p className="text-sm text-muted-foreground font-medium">{t('metrics.totalExpenses')}</p>
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs text-[#FF4D4F] font-medium">↗ {trend} vs mese scorso</p>
            </div>
          </Card>
        </motion.div>

        {/* Card B: Budget Used */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground font-medium">{t('metrics.budgetUsed')}</p>
              <p className="text-3xl font-bold font-mono tabular-nums">{budgetUsedPercentage}%</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsedPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-[#28A745] rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(remaining)} {t('budget.remaining')}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Card C: Top Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground font-medium">{t('metrics.topCategory')}</p>
              <p className="text-2xl font-bold">{topCategory.name}</p>
              <p className="text-lg font-mono tabular-nums text-[#1E88FF]">
                {formatCurrency(topCategory.amount)}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 4. TOP CATEGORIES CHART */}
      <div className="px-4 lg:px-6 mt-6">
        <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border rounded-xl">
          <h3 className="text-lg font-semibold mb-4">{t('categories.top')}</h3>
          <div className="space-y-3">
            {categoryBreakdown.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-3 group hover:scale-[1.02] transition-transform"
              >
                <p className="text-sm font-medium min-w-[120px]">{cat.name}</p>
                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#1E88FF] to-[#1E88FF]/60 transition-all duration-500"
                  />
                </div>
                <p className="text-sm font-mono tabular-nums text-muted-foreground min-w-[100px] text-right">
                  €{cat.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5. TRANSACTIONS LIST */}
      <div className="px-4 lg:px-6 mt-6 pb-24">
        <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border rounded-xl max-h-[600px] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-card pb-2">
            {t('transactions.recent')}
          </h3>
          <div className="space-y-2">
            {transactions.slice(0, 20).map((transaction, index) => {
              const Icon = categoryIcons[transaction.category] || Wallet;
              const isIncome = transaction.type === 'Income';
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#1E88FF]/10">
                      <Icon className="h-5 w-5 text-[#1E88FF]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-medium truncate text-left">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground text-left">
                        {new Date(transaction.date).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <p className={`text-base font-bold font-mono tabular-nums text-right flex-shrink-0 ${
                    isIncome ? 'text-[#28A745]' : 'text-[#FF4D4F]'
                  }`}>
                    {isIncome ? '+' : '-'}€{transaction.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                </motion.div>
              );
            })}

            {transactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t('transactions.noTransactions')}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

