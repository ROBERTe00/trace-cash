import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Tesseract from "tesseract.js";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  payee: string;
  confidence?: number;
}

interface UploadContextType {
  isProcessing: boolean;
  progress: number;
  fileName: string | null;
  uploadFile: (file: File) => Promise<void>;
  extractedTransactions: ExtractedTransaction[];
  bankName: string | null;
  clearTransactions: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [isProcessing, setIsProcessing] = useState(() => {
    const saved = localStorage.getItem("upload-processing");
    return saved === "true";
  });
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem("upload-progress");
    return saved ? parseFloat(saved) : 0;
  });
  const [fileName, setFileName] = useState<string | null>(() => {
    return localStorage.getItem("upload-filename");
  });
  const [extractedTransactions, setExtractedTransactions] = useState<ExtractedTransaction[]>(() => {
    const saved = localStorage.getItem("upload-transactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [bankName, setBankName] = useState<string | null>(() => {
    return localStorage.getItem("upload-bank-name");
  });
  const [toastId, setToastId] = useState<string | number | undefined>();

  const uploadFile = async (file: File) => {
    console.log("📤 [Upload] Starting upload for:", file.name);
    
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Check authentication FIRST
    const { data: { user } } = await supabase.auth.getUser();
    console.log("📤 [Upload] Current user:", user?.email || "❌ NOT LOGGED IN");
    
    if (!user) {
      toast.error("Please log in to upload bank statements");
      return;
    }

    setFileName(file.name);
    setProgress(0);
    setIsProcessing(true);
    
    // Persist state to localStorage
    localStorage.setItem("upload-processing", "true");
    localStorage.setItem("upload-progress", "0");
    localStorage.setItem("upload-filename", file.name);

    // Show persistent toast with progress
    const id = toast(
      <div className="flex items-center gap-3 w-full">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1">
          <p className="font-medium">Processing {file.name}</p>
          <p className="text-xs text-muted-foreground">Analyzing transactions...</p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: '10%' }}
            />
          </div>
        </div>
      </div>,
      {
        duration: Infinity,
        position: "bottom-right",
      }
    );
    setToastId(id);

    try {
      setProgress(20);
      localStorage.setItem("upload-progress", "20");
      updateToastProgress(id, 20, "Uploading file...");

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("bank-statements")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(40);
      localStorage.setItem("upload-progress", "40");
      updateToastProgress(id, 40, "File uploaded, generating secure URL...");

      // Generate signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("bank-statements")
        .createSignedUrl(filePath, 300);

      if (signedError) throw signedError;

      setProgress(60);
      localStorage.setItem("upload-progress", "60");
      updateToastProgress(id, 60, "AI is analyzing your statement...");

      console.log("📤 [Upload] Invoking process-bank-statement edge function...");
      
      // Process with AI
    const { data: processData, error: processError } = await supabase.functions.invoke(
      'process-bank-statement-v2',
      {
        body: {
          fileUrl: signedData.signedUrl,
          fileName: file.name,
        },
      }
    );

      console.log("📤 [Upload] Edge function result:", { 
        success: !processError, 
        error: processError,
        transactionCount: processData?.transactions?.length || 0 
      });

      if (processError) {
        console.log("📤 [Upload] PDF extraction failed, attempting OCR fallback...");
        const ocrSuccess = await handleOCRFallback(file, id);
        if (!ocrSuccess) {
          throw processError;
        }
        return;
      }

      const transactions = processData.transactions || [];
      const detectedBank = processData.bank || "Unknown Bank";
      
      if (transactions.length === 0) {
        console.log("📤 [Upload] No transactions from AI, attempting OCR fallback...");
        const ocrSuccess = await handleOCRFallback(file, id);
        if (!ocrSuccess) {
          toast.dismiss(id);
          toast.error("No transactions found in the statement");
          setIsProcessing(false);
          setFileName(null);
          return;
        }
        return;
      }

      setProgress(100);
      localStorage.setItem("upload-progress", "100");
      setExtractedTransactions(transactions);
      setBankName(detectedBank);
      localStorage.setItem("upload-transactions", JSON.stringify(transactions));
      localStorage.setItem("upload-bank-name", detectedBank);
      
      // Show success toast
      toast.dismiss(id);
      toast(
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium">Processing complete!</p>
            <p className="text-xs text-muted-foreground">
              {detectedBank} - Extracted {transactions.length} transactions
            </p>
          </div>
        </div>,
        {
          duration: 5000,
          position: "bottom-right",
        }
      );

      setIsProcessing(false);
      setFileName(null);

    } catch (error) {
      console.error("Bank statement processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error details:", errorMessage);
      
      toast.dismiss(toastId);
      toast(
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium">Processing failed</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
          </div>
        </div>,
        {
          duration: 8000,
          position: "bottom-right",
        }
      );
      setIsProcessing(false);
      setFileName(null);
      setProgress(0);
      
      // Clear localStorage on error
      localStorage.removeItem("upload-processing");
      localStorage.removeItem("upload-progress");
      localStorage.removeItem("upload-filename");
      localStorage.removeItem("upload-transactions");
    }
  };

  const handleOCRFallback = async (file: File, currentToastId: string | number): Promise<boolean> => {
    console.log('[Upload] Starting OCR fallback extraction...');
    updateToastProgress(currentToastId, 65, 'Trying OCR extraction...');
    
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const ocrProgress = 65 + (m.progress * 20);
            updateToastProgress(currentToastId, ocrProgress, `OCR: ${(m.progress * 100).toFixed(0)}%`);
          }
        }
      });
      
      console.log('[Upload] OCR text extracted, length:', text.length);
      
      // Parse text with simple regex for transactions
      const transactions = parseTextToTransactions(text);
      
      if (transactions.length > 0) {
        console.log('[Upload] OCR extracted', transactions.length, 'transactions');
        setProgress(100);
        localStorage.setItem("upload-progress", "100");
        setExtractedTransactions(transactions);
        setBankName("OCR Extracted");
        localStorage.setItem("upload-transactions", JSON.stringify(transactions));
        localStorage.setItem("upload-bank-name", "OCR Extracted");
        
        toast.dismiss(currentToastId);
        toast(
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">OCR extraction complete!</p>
              <p className="text-xs text-muted-foreground">
                Extracted {transactions.length} transactions (review carefully)
              </p>
            </div>
          </div>,
          {
            duration: 5000,
            position: "bottom-right",
          }
        );
        
        setIsProcessing(false);
        setFileName(null);
        return true;
      }
    } catch (ocrError) {
      console.error('[Upload] OCR also failed:', ocrError);
    }
    return false;
  };

  const parseTextToTransactions = (text: string): ExtractedTransaction[] => {
    const transactions: ExtractedTransaction[] = [];
    const lines = text.split('\n');
    
    // Simple pattern matching for common transaction formats
    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const amountPattern = /[\€\$\£]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const dateMatch = line.match(datePattern);
      const amountMatch = line.match(amountPattern);
      
      if (dateMatch && amountMatch) {
        const rawDate = dateMatch[1];
        const rawAmount = amountMatch[1].replace(/[,\.]/g, '');
        
        // Parse date to YYYY-MM-DD format
        let date = '';
        try {
          const parts = rawDate.split(/[\/\-\.]/);
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            date = `${year}-${month}-${day}`;
          }
        } catch {
          date = new Date().toISOString().split('T')[0];
        }
        
        // Extract description (text between date and amount)
        const description = line
          .replace(datePattern, '')
          .replace(amountPattern, '')
          .trim()
          .substring(0, 100) || 'Transaction';
        
        transactions.push({
          date,
          description,
          amount: -parseFloat(rawAmount) / 100, // Assume expenses, convert cents
          category: "Other",
          payee: description.split(' ')[0] || 'Unknown',
          confidence: 0.5,
        });
      }
    }
    
    console.log('[Upload] Parsed', transactions.length, 'transactions from OCR text');
    return transactions;
  };

  const updateToastProgress = (id: string | number, progress: number, message: string) => {
    toast.dismiss(id);
    const newId = toast(
      <div className="flex items-center gap-3 w-full">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1">
          <p className="font-medium">Processing {fileName}</p>
          <p className="text-xs text-muted-foreground">{message}</p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>,
      {
        duration: Infinity,
        position: "bottom-right",
      }
    );
    setToastId(newId);
  };

  const clearTransactions = () => {
    setExtractedTransactions([]);
    setBankName(null);
    setIsProcessing(false);
    setProgress(0);
    setFileName(null);
    localStorage.removeItem("upload-processing");
    localStorage.removeItem("upload-progress");
    localStorage.removeItem("upload-filename");
    localStorage.removeItem("upload-transactions");
    localStorage.removeItem("upload-bank-name");
  };

  // Clear upload state when user logs out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearTransactions();
        if (toastId) {
          toast.dismiss(toastId);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toastId]);

  return (
    <UploadContext.Provider
      value={{
        isProcessing,
        progress,
        fileName,
        uploadFile,
        extractedTransactions,
        bankName,
        clearTransactions,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within UploadProvider");
  }
  return context;
};