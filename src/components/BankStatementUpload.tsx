import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertTriangle, Building2, Trash2, Eye, RefreshCw, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";
import { z } from "zod";
import { useUpload } from "@/contexts/UploadContext";
import { useApp } from "@/contexts/AppContext";
import { PDFParsingHelp } from "@/components/PDFParsingHelp";
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
import { Badge } from "@/components/ui/badge";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  payee: string;
  bank?: string;
  confidence?: number;
}

interface BankStatementUploadProps {
  onTransactionsExtracted: (expenses: Omit<Expense, "id">[]) => void;
}

const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  description: z.string().max(200, "Description is too long").trim(),
  amount: z.number().min(-999999).max(999999),
  category: z.string(),
});

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
  const { uploadFile, extractedTransactions, bankName, clearTransactions, isProcessing } = useUpload();
  const { t } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [editedTransactions, setEditedTransactions] = useState<ExtractedTransaction[]>([]);
  const [showRawText, setShowRawText] = useState(false);
  const [rawExtractedText, setRawExtractedText] = useState<string>("");
  const [showParsingHelp, setShowParsingHelp] = useState(false);
  const [lastFileName, setLastFileName] = useState<string>("");
  const [extractionMethod, setExtractionMethod] = useState<"text" | "vision" | null>(null);

  useEffect(() => {
    if (extractedTransactions.length > 0 && !showVerification) {
      setEditedTransactions(extractedTransactions);
      
      // Capture extraction method from response
      const method = (extractedTransactions[0] as any).extractionMethod || "text";
      setExtractionMethod(method);
      console.log(`📊 Extraction method used: ${method}`);
      
      setShowVerification(true);
      setShowParsingHelp(false);
      
      // Show help if very few transactions extracted
      if (extractedTransactions.length < 3) {
        setShowParsingHelp(true);
      }
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
    setLastFileName(file.name);
    setShowParsingHelp(false);
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
      toast.success(`${expenses.length} transactions added successfully!`);
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

  const deleteTransaction = (index: number) => {
    const updated = editedTransactions.filter((_, i) => i !== index);
    setEditedTransactions(updated);
    toast.info("Transaction removed");
  };

  const handleReparse = () => {
    setShowVerification(false);
    clearTransactions();
    toast.info("Upload a new file to re-parse");
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    if (confidence >= 0.8) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    } else if (confidence >= 0.6) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    }
  };

  const lowConfidenceCount = editedTransactions.filter(t => (t.confidence || 0) < 0.6).length;

  return (
    <>
      <Card className="glass-card border-2 hover-lift p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold">{t("upload")} Bank Statement</h3>
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
                <p className="font-medium">Advanced AI Analysis</p>
              <ul className="text-muted-foreground space-y-1 mt-1">
                <li>✓ Extracts ALL transactions (no limits)</li>
                <li>✓ Detects bank name automatically</li>
                <li>✓ Smart categorization with confidence scores</li>
                <li>✓ Multi-page support</li>
                <li>✓ AI Vision fallback for complex PDFs</li>
              </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {showParsingHelp && (
        <PDFParsingHelp
          fileName={lastFileName}
          transactionsFound={editedTransactions.length}
          errorMessage={editedTransactions.length < 3 ? "Very few transactions extracted. The PDF format may not be fully supported." : undefined}
        />
      )}

      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bankName && (
                <>
                  <Building2 className="h-5 w-5 text-primary" />
                  {bankName} -
                </>
              )}
              Review & Edit Transactions
            </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
            <span>
              Found {editedTransactions.length} transaction{editedTransactions.length !== 1 ? 's' : ''}
            </span>
            
            {extractionMethod === "vision" && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Eye className="h-3 w-3 mr-1" />
                AI Vision Powered
              </Badge>
            )}
            {extractionMethod === "text" && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                <FileText className="h-3 w-3 mr-1" />
                Text Extraction
              </Badge>
            )}
              {lowConfidenceCount > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lowConfidenceCount} need review
                </Badge>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRawText(!showRawText)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showRawText ? "Hide" : "Show"} Raw Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReparse}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-parse
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>

          {showRawText && (
            <div className="mx-6 mb-4 p-4 bg-muted rounded-lg max-h-40 overflow-auto">
              <p className="text-xs font-mono whitespace-pre-wrap">{rawExtractedText || "No raw text available"}</p>
            </div>
          )}

          <div className="flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[180px]">Category</TableHead>
                  <TableHead className="w-[100px]">Confidence</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedTransactions.map((transaction, index) => (
                  <TableRow 
                    key={index}
                    className={transaction.confidence && transaction.confidence < 0.6 ? 'bg-yellow-500/5' : ''}
                  >
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
                        className={`w-full text-right font-medium ${
                          transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
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
                    <TableCell>
                      {getConfidenceBadge(transaction.confidence)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTransaction(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex-shrink-0 gap-2">
            <Button variant="outline" onClick={() => {
              setShowVerification(false);
              clearTransactions();
            }}>
              {t("cancel")}
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/upload?tab=csv', '_blank')}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Upload CSV Instead
            </Button>
            <Button onClick={handleConfirm} disabled={editedTransactions.length === 0}>
              {t("confirm")} & {t("add")} {editedTransactions.length} Transactions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};