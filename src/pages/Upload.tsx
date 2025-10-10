import { useState, useEffect } from "react";
import { BankStatementUpload } from "@/components/BankStatementUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { getExpenses, saveExpenses, Expense } from "@/lib/storage";
import { toast } from "sonner";

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
            AI-powered bank statement extraction
          </p>
        </div>
      </div>

      <VoiceExpenseInput onExpenseDetected={handleSingleExpense} />

      <BankStatementUpload onTransactionsExtracted={handleBulkAddExpenses} />

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">How it works</h3>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-1">🎤 Voice Input</h4>
            <p className="text-sm text-muted-foreground">
              Click the microphone and say something like "Add 50 euros food expense" or "Spent 30 on transport"
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-1">📄 PDF Upload</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Upload your bank statement PDF (max 10MB)</li>
              <li>AI extracts transactions automatically</li>
              <li>Review and edit categories</li>
              <li>Confirm to add to your expenses</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
