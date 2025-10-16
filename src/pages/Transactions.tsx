import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/ExpenseForm";
import { TransactionTable } from "@/components/TransactionTable";
import { ExpensesSummary } from "@/components/ExpensesSummary";
import { ExpenseInsights } from "@/components/ExpenseInsights";
import { BankStatementUpload } from "@/components/BankStatementUpload";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { BudgetLimitsManager } from "@/components/BudgetLimitsManager";
import { CategoryManager } from "@/components/CategoryManager";
import { Separator } from "@/components/ui/separator";
import { useExpenses } from "@/hooks/useExpenses";
import { Wallet, BarChart3, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Transactions() {
  const { expenses, createExpense, deleteExpense } = useExpenses();

  // Convert Supabase expense format to local storage format for compatibility
  const handleAddExpense = (expense: any) => {
    createExpense(expense);
  };

  const handleTransactionsExtracted = (extractedExpenses: any[]) => {
    extractedExpenses.forEach(exp => createExpense(exp));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="icon-card text-primary" />
            </div>
            <div>
              <h1 className="text-section">Transazioni</h1>
              <p className="text-sm text-muted-foreground">Gestisci entrate e uscite</p>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      {/* Simplified Tabs: 3 instead of 5 */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="transactions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
            <Wallet className="icon-button" />
            <span className="hidden sm:inline">Transazioni</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
            <BarChart3 className="icon-button" />
            <span className="hidden sm:inline">Analisi</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
            <Upload className="icon-button" />
            <span className="hidden sm:inline">Importa</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Transactions - 2-column layout on desktop */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Top row: Summary + Form side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExpensesSummary expenses={expenses as any} />
            <ExpenseForm onAdd={handleAddExpense} />
          </div>
          
          {/* Full width table */}
          <TransactionTable
            transactions={expenses as any}
            onDelete={deleteExpense}
          />
        </TabsContent>

        {/* TAB 2: Analysis - Compact layout */}
        <TabsContent value="analysis" className="space-y-4">
          <ExpenseInsights expenses={expenses as any} />
        </TabsContent>

        {/* TAB 3: Import - Compact 2-column layout */}
        <TabsContent value="import" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Import Methods */}
            <Card className="glass-card p-4">
              <h3 className="text-card-title mb-3 flex items-center gap-2">
                <Upload className="icon-card text-primary" />
                Importa Dati
              </h3>
              <div className="space-y-3">
                <VoiceExpenseInput onExpenseDetected={handleAddExpense} />
                <CSVExcelUpload onTransactionsParsed={() => {}} />
                <BankStatementUpload onTransactionsExtracted={handleTransactionsExtracted} />
              </div>
            </Card>

            {/* Right: Configuration */}
            <Card className="glass-card p-4">
              <h3 className="text-card-title mb-3">Configurazione</h3>
              <div className="space-y-4">
                <BudgetLimitsManager expenses={expenses as any} />
                <CategoryManager />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
