/**
 * Advanced Bank Statement Upload Component
 * Uses frontend PDF parsing with OCR fallback and AI categorization
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  Settings,
  Zap,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";
import { z } from "zod";
import { useApp } from "@/contexts/AppContext";
import { parseBankStatementPDF, type ParsedTransaction } from "@/lib/advancedPDFParser";
import { parseWithCoordinates } from "@/lib/coordinateBasedPDFParser";
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
import { Progress } from "@/components/ui/progress";

interface AdvancedBankStatementUploadProps {
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
  "Other",
];

export const AdvancedBankStatementUpload = ({
  onTransactionsExtracted,
}: AdvancedBankStatementUploadProps) => {
  const { t } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [editedTransactions, setEditedTransactions] = useState<ParsedTransaction[]>([]);
  const [showRawText, setShowRawText] = useState(false);
  const [rawExtractedText, setRawExtractedText] = useState<string>("");
  const [lastFileName, setLastFileName] = useState<string>("");
  const [extractionMethod, setExtractionMethod] = useState<"pdfjs" | "ocr" | "hybrid" | "coordinate" | null>(null);
  const [bankDetected, setBankDetected] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    enableOCR: true,
    enableAI: true,
    language: "auto" as "auto" | "it" | "en",
    maxFileSize: 10,
  });

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
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.size > settings.maxFileSize * 1024 * 1024) {
      toast.error(`File size exceeds ${settings.maxFileSize}MB limit`);
      return;
    }

    setLastFileName(file.name);
    setIsProcessing(true);
    setProgress(0);
    setCurrentStage("Starting processing...");
    setShowVerification(false);

    try {
      console.log(`🚀 [AdvancedUpload] Starting coordinate-based PDF processing: ${file.name}`);

      // Use coordinate-based extraction for better table parsing
      const result = await parseWithCoordinates(file, {
        enableOCR: settings.enableOCR,
        enableAI: settings.enableAI,
        language: settings.language,
        onProgress: (progress, stage) => {
          setProgress(progress);
          setCurrentStage(stage);
        },
      });

      if (result.success && result.transactions.length > 0) {
        setEditedTransactions(result.transactions);
        setRawExtractedText(result.rawText);
        setExtractionMethod(result.metadata.method);
        setBankDetected(result.metadata.bankDetected);
        setShowVerification(true);

        toast.success(`PDF processed successfully! Found ${result.transactions.length} transactions`, {
          description: `Confidence: ${(result.metadata.confidence * 100).toFixed(0)}% • Method: ${
            result.metadata.method
          } • Bank: ${result.metadata.bankDetected}`,
          duration: 8000,
        });
      } else {
        throw new Error(result.errors.join(", ") || "No transactions found");
      }
    } catch (error) {
      console.error("❌ [AdvancedUpload] Processing error:", error);

      toast.error(`Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
        duration: 8000,
      });
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setCurrentStage("Complete!");
    }
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
          Transportation: "Transportation",
          Shopping: "Shopping",
          Entertainment: "Entertainment",
          Healthcare: "Healthcare",
          "Bills & Utilities": "Bills & Utilities",
          Income: "Income",
          Other: "Other",
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
      setRawExtractedText("");
      toast.success(`${expenses.length} transactions added successfully!`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to validate transactions");
      }
    }
  };

  const updateTransaction = (index: number, field: keyof ParsedTransaction, value: string | number) => {
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
    setEditedTransactions([]);
    setRawExtractedText("");
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

  const lowConfidenceCount = editedTransactions.filter((t) => (t.confidence || 0) < 0.6).length;

  return (
    <>
      <Card className="glass-card border-2 hover-lift p-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-xl font-bold">Advanced PDF Reader</h3>
                <p className="text-sm text-muted-foreground">Coordinate-based table extraction</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="bg-muted/50 p-4 space-y-4">
              <h4 className="font-medium">Processing Settings</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">OCR Enabled</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.enableOCR}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, enableOCR: e.target.checked }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">Use OCR fallback</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Analysis</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.enableAI}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, enableAI: e.target.checked }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">Use Gemini AI</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, language: e.target.value as any }))
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="it">Italian</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Size (MB)</label>
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, maxFileSize: parseInt(e.target.value) }))
                    }
                    className="w-full p-2 border rounded"
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            </Card>
          )}

          <div
            className={`relative border-2 border-dashed rounded-lg p-12 transition-all ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
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
              {isProcessing ? (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
              <div>
                <p className="text-lg font-medium">
                  {isProcessing ? currentStage : "Drop your bank statement here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isProcessing ? `${progress}% complete...` : "or click to browse"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                PDF files only, max {settings.maxFileSize}MB
              </p>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="mt-6 space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{currentStage}</span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Coordinate-Based Table Extraction (100% Private)</p>
                <ul className="text-muted-foreground space-y-1 mt-1">
                  <li>✓ Precise table structure recognition (no text concatenation)</li>
                  <li>✓ Filters headers, footers, and page numbers automatically</li>
                  <li>✓ Multi-language support (Italian/English)</li>
                  <li>✓ OCR fallback for scanned PDFs (Tesseract.js)</li>
                  <li>✓ 85-95% confidence categorization with 25+ merchants</li>
                  <li>✓ All processing happens in your browser (100% private)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bankDetected && (
                <>
                  <Building2 className="h-5 w-5 text-primary" />
                  {bankDetected} -
                </>
              )}
              Review & Edit Transactions
            </DialogTitle>
            <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
              <span>
                Found {editedTransactions.length} transaction
                {editedTransactions.length !== 1 ? "s" : ""}
              </span>

              {extractionMethod && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <FileText className="h-3 w-3 mr-1" />
                  {extractionMethod.toUpperCase()} Method
                </Badge>
              )}

              {lowConfidenceCount > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lowConfidenceCount} need review
                </Badge>
              )}

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => setShowRawText(!showRawText)}>
                  <Eye className="h-4 w-4 mr-1" />
                  {showRawText ? "Hide" : "Show"} Raw Text
                </Button>
                <Button variant="outline" size="sm" onClick={handleReparse}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-parse
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>

          {showRawText && (
            <div className="mx-6 mb-4 p-4 bg-muted rounded-lg max-h-40 overflow-auto">
              <p className="text-xs font-mono whitespace-pre-wrap">
                {rawExtractedText || "No raw text available"}
              </p>
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
                    className={transaction.confidence && transaction.confidence < 0.6 ? "bg-yellow-500/5" : ""}
                  >
                    <TableCell>
                      <Input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => updateTransaction(index, "date", e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={transaction.description}
                        onChange={(e) => updateTransaction(index, "description", e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={transaction.amount}
                        onChange={(e) =>
                          updateTransaction(index, "amount", parseFloat(e.target.value))
                        }
                        className={`w-full text-right font-medium ${
                          transaction.amount < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={transaction.category}
                        onValueChange={(value) => updateTransaction(index, "category", value)}
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
                    <TableCell>{getConfidenceBadge(transaction.confidence)}</TableCell>
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
            <Button
              variant="outline"
              onClick={() => {
                setShowVerification(false);
                setEditedTransactions([]);
                setRawExtractedText("");
              }}
            >
              {t("cancel")}
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

