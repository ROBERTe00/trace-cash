/**
 * Transactions Page - Redesigned
 * Modern, modular layout with interactive charts and filters
 */

import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import { TransactionBalanceSummary } from "@/components/transactions/TransactionBalanceSummary";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { InteractiveCategoryChart } from "@/components/transactions/InteractiveCategoryChart";
import { EnhancedTransactionList } from "@/components/transactions/EnhancedTransactionList";
import { UnifiedImportSection } from "@/components/transactions/UnifiedImportSection";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

export default function TransactionsRedesigned() {
  const { expenses, createExpense, deleteExpense } = useExpenses();
  const { filters, setFilters, filteredTransactions, availableCategories } = useTransactionFilters(expenses as any);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);

  // Calculate totals
  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  // Prepare category chart data
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenses
      .filter((e) => e.type === "Expense")
      .forEach((expense) => {
        const current = categoryMap.get(expense.category) || { amount: 0, count: 0 };
        categoryMap.set(expense.category, {
          amount: current.amount + expense.amount,
          count: current.count + 1,
        });
      });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        color: '#3B82F6',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Handle category filter from chart click
  const handleCategoryClick = (category: string) => {
    if (category === filters.categories[0] && filters.categories.length === 1) {
      // Deselect if already selected
      setFilters({ ...filters, categories: [] });
    } else {
      // Select category
      setFilters({ ...filters, categories: [category] });
    }
  };

  const handleAddExpense = (expense: any) => {
    createExpense(expense);
    setShowAddDialog(false);
  };

  const handleTransactionsExtracted = (extractedExpenses: any[]) => {
    extractedExpenses.forEach((exp) => createExpense(exp));
  };

  return (
    <div className="space-y-6 animate-fade-in safe-width pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Transazioni</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestisci entrate e uscite</p>
        </div>
        <Wallet className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
      </motion.div>

      {/* Balance Summary Card */}
      <TransactionBalanceSummary
        totalBalance={totalBalance}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        onAddTransaction={() => setShowAddDialog(true)}
        onImport={() => setShowImportSection(true)}
      />

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableCategories={availableCategories}
      />

      {/* Main Content Grid: Chart + List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Category Chart (40% on desktop) */}
        <div className="lg:col-span-2">
          <InteractiveCategoryChart
            data={categoryData}
            onCategoryClick={handleCategoryClick}
            selectedCategory={filters.categories[0]}
          />
        </div>

        {/* Transaction List (60% on desktop) */}
        <div className="lg:col-span-3">
          <EnhancedTransactionList
            transactions={filteredTransactions as any}
            onDelete={deleteExpense}
          />
        </div>
      </div>

      {/* Import Section (Collapsible, at bottom) */}
      <UnifiedImportSection
        onTransactionsExtracted={handleTransactionsExtracted}
        defaultCollapsed={!showImportSection}
      />

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Transazione</DialogTitle>
          </DialogHeader>
          <ExpenseForm onAdd={handleAddExpense} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

