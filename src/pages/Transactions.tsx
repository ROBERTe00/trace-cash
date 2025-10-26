import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/ExpenseForm";
import { TransactionTable } from "@/components/TransactionTable";
import { EnhancedTransactionTable } from "@/components/EnhancedTransactionTable";
import { ExpensesSummary } from "@/components/ExpensesSummary";
import { ExpenseInsights } from "@/components/ExpenseInsights";
import { TransactionAnalysisPanel } from "@/components/transactions/TransactionAnalysisPanel";
import { AdvancedBankStatementUpload } from "@/components/AdvancedBankStatementUpload";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { GroupedTransactionList } from "@/components/GroupedTransactionList";
import { ImprovedBalanceSummary } from "@/components/ImprovedBalanceSummary";
import { DesignedTransactionsTab } from "@/components/DesignedTransactionsTab";
import { useExpenses } from "@/hooks/useExpenses";
import { Wallet, BarChart3, Upload, X, TrendingUp, TrendingDown, Calendar, Filter, Search, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function Transactions() {
  const { expenses, createExpense, deleteExpense } = useExpenses();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "income" | "expense">("all");

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

  // Filter transactions by search query and type
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = !searchQuery || e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
      (selectedFilter === "income" && e.type === "Income") ||
      (selectedFilter === "expense" && e.type === "Expense");
    return matchesSearch && matchesFilter;
  });

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

      {/* TABS - Subito sotto l'header */}
      <Tabs defaultValue="transactions" className="space-y-6">
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

        {/* TAB 1: TRANSACTIONS */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Overview Header con pulsanti */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Ottobre 2025
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtri
              </Button>
            </div>
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Totale Mese</p>
                  <p className="text-3xl font-bold text-green-600">
                    {totalIncome - totalExpenses > 0 ? '+' : ''}€{(totalIncome - totalExpenses).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {expenses.length} transazioni
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entrate</p>
                  <p className="text-2xl font-bold">€{totalIncome.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {expenses.filter(e => e.type === 'Income').length} registrazioni
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uscite</p>
                  <p className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {expenses.filter(e => e.type === 'Expense').length} registrazioni
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Filters Bar */}
          <Card className="p-4 border-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca transazioni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 max-w-xs"
              />
              <Button
                variant={selectedFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
              >
                Tutte
              </Button>
              <Button
                variant={selectedFilter === "income" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedFilter("income")}
              >
                Entrate
              </Button>
              <Button
                variant={selectedFilter === "expense" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedFilter("expense")}
              >
                Uscite
              </Button>
            </div>
          </Card>

          {/* Layout Transaction List + Insights Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transaction List - 2/3 */}
            <div className="lg:col-span-2">
              <Card className="p-6 border-0">
                <h3 className="text-lg font-semibold mb-4">Elenco Transazioni</h3>
                <GroupedTransactionList 
                  transactions={filteredExpenses as any}
                  onDelete={deleteExpense}
                />
              </Card>
            </div>

            {/* Insights Sidebar - 1/3 */}
            <div className="lg:col-span-1">
              <Card className="p-6 border-0">
                <h3 className="text-lg font-semibold mb-4">Insights</h3>
                
                {/* Top 3 Categorie */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-muted-foreground">Top 3 Categorie</p>
                  {['Shopping', 'Food', 'Transportation'].map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-primary`} />
                        <span className="text-sm">{cat}</span>
                      </div>
                      <span className="text-sm font-semibold">€{(Math.random() * 1000 | 0)}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Media giornaliera</span>
                    <span className="font-semibold">€{(totalExpenses / 30).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giorni rimasti</span>
                    <span className="font-semibold">{30 - new Date().getDate()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ANALYSIS */}
        <TabsContent value="analysis" className="space-y-4">
          <TransactionAnalysisPanel expenses={expenses as any} />
        </TabsContent>

        {/* TAB 3: IMPORT */}
        <TabsContent value="import" className="space-y-4">
          <Card className="modern-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importa Transazioni
            </h3>
            <div className="space-y-4">
              <VoiceExpenseInput onExpenseDetected={handleAddExpense} />
              <CSVExcelUpload onTransactionsParsed={() => {}} />
              <AdvancedBankStatementUpload onTransactionsExtracted={handleTransactionsExtracted} />
            </div>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Add Form Modal */}
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
    </div>
  );
}
