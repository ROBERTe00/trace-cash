import { useState, useEffect } from "react";
import { BankStatementUpload } from "@/components/BankStatementUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { TransactionPreview } from "@/components/TransactionPreview";
import { getExpenses, saveExpenses, Expense } from "@/lib/storage";
import { ParseResult } from "@/lib/csvParser";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileSpreadsheet, Mic } from "lucide-react";

export default function Upload() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleCSVParsed = (result: ParseResult) => {
    setParseResult(result);
    setShowPreview(true);
  };

  const handlePreviewConfirm = (newExpenses: Omit<Expense, "id">[]) => {
    const withIds = newExpenses.map((e) => ({ ...e, id: crypto.randomUUID() }));
    const updated = [...expenses, ...withIds];
    setExpenses(updated);
    saveExpenses(updated);
    toast.success(`${newExpenses.length} transactions imported!`, {
      description: 'Transactions have been added to your expenses'
    });
    setShowPreview(false);
    setParseResult(null);
  };

  const handlePreviewCancel = () => {
    setShowPreview(false);
    setParseResult(null);
  };

  if (showPreview && parseResult) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Review Import</h1>
          <p className="text-muted-foreground">
            Verify and edit transactions before importing
          </p>
        </div>
        <TransactionPreview
          parseResult={parseResult}
          onConfirm={handlePreviewConfirm}
          onCancel={handlePreviewCancel}
        />
      </div>
    );
  }

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
          <CSVExcelUpload
            existingExpenses={expenses}
            onTransactionsParsed={handleCSVParsed}
          />

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">✨ Smart Features</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <span className="text-primary">•</span> Auto Column Detection
                </h4>
                <p className="text-sm text-muted-foreground">
                  Automatically finds date, description, and amount columns in your file
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <span className="text-primary">•</span> AI Categorization
                </h4>
                <p className="text-sm text-muted-foreground">
                  AI analyzes descriptions to categorize transactions automatically
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <span className="text-primary">•</span> Duplicate Detection
                </h4>
                <p className="text-sm text-muted-foreground">
                  Identifies and flags duplicate transactions to prevent double-counting
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <span className="text-primary">•</span> Local Processing
                </h4>
                <p className="text-sm text-muted-foreground">
                  Files are parsed in your browser for maximum privacy and security
                </p>
              </div>
            </div>
          </div>
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
