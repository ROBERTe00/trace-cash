import { useState, useEffect } from "react";
import { BankStatementUpload } from "@/components/BankStatementUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { getExpenses, saveExpenses, Expense } from "@/lib/storage";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Mic, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Upload() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setExpenses(getExpenses());
  }, []);

  const handleBulkAddExpenses = (newExpenses: Omit<Expense, "id">[]) => {
    const withIds = newExpenses.map((e) => ({ ...e, id: crypto.randomUUID() }));
    const updated = [...expenses, ...withIds];
    setExpenses(updated);
    saveExpenses(updated);
    toast.success(`${newExpenses.length} transactions added!`);
  };

  const handleSingleExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Upload Statement</h1>
          <p className="text-muted-foreground">
            AI-powered transaction import with smart categorization
          </p>
        </div>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV / Excel
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF Statement
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice Input
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4 mt-6">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">CSV / Excel Import</h3>
              <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upload CSV or Excel files with automatic parsing and AI categorization
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Auto column detection (date, description, amount)</p>
              <p>• Duplicate transaction detection</p>
              <p>• AI-powered smart categorization</p>
              <p>• Local processing for privacy</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4 mt-6">
          <BankStatementUpload onTransactionsExtracted={handleBulkAddExpenses} />

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">📄 PDF Import</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Upload your bank statement PDF (max 10MB)</li>
              <li>AI extracts transactions automatically</li>
              <li>Review and edit categories in the preview</li>
              <li>Confirm to add to your expenses</li>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4 mt-6">
          <VoiceExpenseInput onExpenseDetected={handleSingleExpense} />

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">🎤 Voice Input</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Click the microphone and say something like:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• "Add 50 euros food expense"</li>
              <li>• "Spent 30 on transport yesterday"</li>
              <li>• "Add 15 euro coffee this morning"</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
