import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/ExpenseForm";
import { TransactionTable } from "@/components/TransactionTable";
import { EnhancedTransactionTable } from "@/components/EnhancedTransactionTable";
import { ExpensesSummary } from "@/components/ExpensesSummary";
import { ExpenseInsights } from "@/components/ExpenseInsights";
import { AdvancedBankStatementUpload } from "@/components/AdvancedBankStatementUpload";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { GroupedTransactionList } from "@/components/GroupedTransactionList";
import { ImprovedBalanceSummary } from "@/components/ImprovedBalanceSummary";
import { DesignedTransactionsTab } from "@/components/DesignedTransactionsTab";
import { useExpenses } from "@/hooks/useExpenses";
import { Wallet, BarChart3, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function Transactions() {
  const { expenses, createExpense, deleteExpense } = useExpenses();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Convert Supabase expense format to local storage format for compatibility
  const handleAddExpense = (expense: any) => {
    createExpense(expense);
    setShowAddForm(false);
  };

  const handleTransactionsExtracted = (extractedExpenses: any[]) => {
    extractedExpenses.forEach(exp => createExpense(exp));
  };

  // Calculate totals
  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  // Filter transactions by search query
  const filteredExpenses = searchQuery
    ? expenses.filter((e) =>
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : expenses;

  return (
    <div className="space-y-6 animate-fade-in safe-width">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transazioni</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestisci entrate e uscite</p>
        </div>
        <Wallet className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
      </div>

      {/* Improved Balance Summary */}
      <ImprovedBalanceSummary
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        onAddClick={() => setShowAddForm(!showAddForm)}
        onSearch={setSearchQuery}
      />

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="grid w-full min-w-[300px] grid-cols-3 h-11 p-1 bg-muted rounded-xl">
            <TabsTrigger value="transactions" className="gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm min-h-[44px]">
              <Wallet className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Transazioni</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm min-h-[44px]">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Analisi</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm min-h-[44px]">
              <Upload className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Importa</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Transactions - New Design */}
        <TabsContent value="transactions" className="space-y-0">
          <DesignedTransactionsTab
            transactions={filteredExpenses as any}
            totalExpenses={totalExpenses}
            budget={1500}
            budgetUsedPercentage={Math.min(100, (totalExpenses / 1500) * 100)}
            topCategory={{ 
              name: expenses
                .filter(e => e.type === 'Expense')
                .reduce((acc, e) => {
                  const current = acc.get(e.category) || 0;
                  acc.set(e.category, current + e.amount);
                  return acc;
                }, new Map<string, number>())
                .entries()
                .next().value?.[0] || 'Other',
              amount: expenses
                .filter(e => e.type === 'Expense')
                .reduce((acc, e) => {
                  const current = acc.get(e.category) || 0;
                  acc.set(e.category, current + e.amount);
                  return acc;
                }, new Map<string, number>())
                .entries()
                .next().value?.[1] || 0
            }}
            categoryBreakdown={
              Array.from(
                expenses
                  .filter(e => e.type === 'Expense')
                  .reduce((map, e) => {
                    const current = map.get(e.category) || 0;
                    map.set(e.category, current + e.amount);
                    return map;
                  }, new Map<string, number>())
                  .entries()
              )
                .map(([name, amount]) => ({
                  name,
                  amount,
                  percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 4)
            }
            onSearch={setSearchQuery}
            onAddTransaction={() => setShowAddForm(true)}
            onEditBudget={() => alert('Navigate to settings to edit budget')}
          />
          
          {/* Add Form Modal (shown when "+ Aggiungi" clicked) */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="p-6 max-w-md w-full relative">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
                <ExpenseForm onAdd={handleAddExpense} />
              </Card>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          <ExpenseInsights expenses={expenses as any} />
        </TabsContent>

        {/* TAB 3: Import */}
        <TabsContent value="import" className="space-y-4">
          <Card className="modern-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importa Transazioni
            </h3>
            <div className="space-y-4">
              <VoiceExpenseInput onExpenseDetected={handleAddExpense} />
              <CSVExcelUpload onTransactionsParsed={() => {}} />
              
              {/* Advanced Frontend PDF Reader with OCR */}
              <AdvancedBankStatementUpload onTransactionsExtracted={handleTransactionsExtracted} />
            </div>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
