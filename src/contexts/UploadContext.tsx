import { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  payee: string;
}

interface UploadContextType {
  isProcessing: boolean;
  progress: number;
  fileName: string | null;
  uploadFile: (file: File) => Promise<void>;
  extractedTransactions: ExtractedTransaction[];
  clearTransactions: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedTransactions, setExtractedTransactions] = useState<ExtractedTransaction[]>([]);
  const [toastId, setToastId] = useState<string | number | undefined>();

  const uploadFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFileName(file.name);
    setProgress(0);
    setIsProcessing(true);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to upload bank statements");
        return;
      }

      setProgress(20);
      updateToastProgress(id, 20, "Uploading file...");

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("bank-statements")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(40);
      updateToastProgress(id, 40, "File uploaded, generating secure URL...");

      // Generate signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("bank-statements")
        .createSignedUrl(filePath, 300);

      if (signedError) throw signedError;

      setProgress(60);
      updateToastProgress(id, 60, "AI is analyzing your statement...");

      // Process with AI
      const { data: processData, error: processError } = await supabase.functions.invoke(
        'process-bank-statement',
        {
          body: {
            fileUrl: signedData.signedUrl,
            fileName: file.name,
          },
        }
      );

      if (processError) throw processError;

      const transactions = processData.transactions || [];
      
      if (transactions.length === 0) {
        toast.dismiss(id);
        toast.error("No transactions found in the statement");
        setIsProcessing(false);
        setFileName(null);
        return;
      }

      setProgress(100);
      setExtractedTransactions(transactions);
      
      // Show success toast
      toast.dismiss(id);
      toast(
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium">Processing complete!</p>
            <p className="text-xs text-muted-foreground">
              Extracted {transactions.length} transactions
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
    }
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
  };

  return (
    <UploadContext.Provider
      value={{
        isProcessing,
        progress,
        fileName,
        uploadFile,
        extractedTransactions,
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