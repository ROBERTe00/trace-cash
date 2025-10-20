import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/ExpenseForm";
import { TransactionTable } from "@/components/TransactionTable";
import { ExpensesSummary } from "@/components/ExpensesSummary";
import { ExpenseInsights } from "@/components/ExpenseInsights";
import { BankStatementUpload } from "@/components/BankStatementUpload";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-safe w-full">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transazioni</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestisci entrate e uscite</p>
        </div>
        <Wallet className="h-8 w-8 text-primary" />
      </div>

      {/* Clean Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted rounded-xl">
          <TabsTrigger value="transactions" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Transazioni</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analisi</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Upload className="h-4 w-4" />
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

        {/* TAB 3: Import */}
        <TabsContent value="import" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importa Transazioni
            </h3>
            <div className="space-y-4">
              <VoiceExpenseInput onExpenseDetected={handleAddExpense} />
              <CSVExcelUpload onTransactionsParsed={() => {}} />
              <BankStatementUpload onTransactionsExtracted={handleTransactionsExtracted} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
