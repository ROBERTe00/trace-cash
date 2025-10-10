import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";
import { z } from "zod";
import { useUpload } from "@/contexts/UploadContext";

const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  description: z.string().max(200, "Description is too long").trim(),
  amount: z.number().min(-999999).max(999999),
  category: z.string(),
});
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  payee: string;
}

interface BankStatementUploadProps {
  onTransactionsExtracted: (expenses: Omit<Expense, "id">[]) => void;
}

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Bills & Utilities",
  "Income",
  "Other"
];

export const BankStatementUpload = ({ onTransactionsExtracted }: BankStatementUploadProps) => {
  const { uploadFile, extractedTransactions, clearTransactions, isProcessing } = useUpload();
  const [dragActive, setDragActive] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [editedTransactions, setEditedTransactions] = useState<ExtractedTransaction[]>([]);

  useEffect(() => {
    if (extractedTransactions.length > 0 && !showVerification) {
      setEditedTransactions(extractedTransactions);
      setShowVerification(true);
    }
  }, [extractedTransactions]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    await uploadFile(file);
  };

  const handleConfirm = () => {
    try {
      const expenses: Omit<Expense, "id">[] = editedTransactions.map((t) => {
        // Validate transaction
        const validation = transactionSchema.safeParse(t);
        if (!validation.success) {
          throw new Error(`Invalid transaction: ${validation.error.errors[0].message}`);
        }

        // Map AI categories to valid Expense categories
        const categoryMap: Record<string, Expense["category"]> = {
          "Food & Dining": "Food & Dining",
          "Transportation": "Transportation",
          "Shopping": "Shopping",
          "Entertainment": "Entertainment",
          "Healthcare": "Healthcare",
          "Bills & Utilities": "Bills & Utilities",
          "Income": "Income",
          "Other": "Other"
        };
        
        return {
          type: t.amount > 0 ? "Income" : "Expense",
          amount: Math.abs(t.amount),
          category: categoryMap[t.category] || "Other",
          description: t.description,
          date: t.date,
          recurring: false,
        };
      });

      onTransactionsExtracted(expenses);
      setShowVerification(false);
      setEditedTransactions([]);
      clearTransactions();
      toast.success("Transactions added successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to validate transactions");
      }
    }
  };

  const updateTransaction = (index: number, field: keyof ExtractedTransaction, value: string | number) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTransactions(updated);
  };

  return (
    <>
      <Card className="glass-card border-2 hover-lift p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold">Upload Bank Statement</h3>
          </div>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 transition-all ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drop your bank statement here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <p className="text-xs text-muted-foreground">PDF files only, max 10MB</p>
              {isProcessing && (
                <p className="text-xs text-primary font-medium">
                  Processing in background... You can navigate to other pages
                </p>
              )}
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">AI-Powered Extraction</p>
                <p className="text-muted-foreground">
                  Our AI automatically extracts and categorizes your transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review & Edit Transactions</DialogTitle>
            <DialogDescription>
              Review the extracted transactions and edit categories if needed
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedTransactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => updateTransaction(index, 'date', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={transaction.description}
                        onChange={(e) => updateTransaction(index, 'description', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={transaction.amount}
                        onChange={(e) => updateTransaction(index, 'amount', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={transaction.category}
                        onValueChange={(value) => updateTransaction(index, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerification(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm & Add {editedTransactions.length} Transactions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
