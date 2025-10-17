import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AIFeedbackModal } from "@/components/AIFeedbackModal";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

interface CSVExcelUploadProps {
  onTransactionsParsed: (result: ParseResult) => void;
}

export const CSVExcelUpload = ({ onTransactionsParsed }: CSVExcelUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Please upload a CSV or Excel file');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return false;
    }

    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsProcessing(true);

    try {
      const toastId = toast.loading(`Analizzando ${file.name}...`, {
        description: 'AI sta categorizzando le transazioni'
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Devi effettuare il login");
        setIsProcessing(false);
        return;
      }

      // Read file content
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const fileContent = e.target?.result as string;
        const fileType = file.name.endsWith('.csv') ? 'csv' : 'excel';

        // Simulate real-time progress with interval
        let currentProgress = 10;
        const progressInterval = setInterval(() => {
          currentProgress = Math.min(currentProgress + 8, 90); // Cap at 90%
          toast.loading(`Elaborazione: ${currentProgress}%`, {
            id: toastId,
            description: currentProgress < 40 ? 'Parsing file...' : currentProgress < 70 ? 'AI categorization in progress...' : 'Almost done...'
          });
        }, 800);

        try {
          // Call new smart AI function with batch processing
          const { data, error } = await supabase.functions.invoke('parse-smart-transactions', {
            body: {
              fileContent,
              fileType,
              userId: user.id,
            },
          });

          clearInterval(progressInterval);
          toast.dismiss(toastId);

          if (error || !data?.success) {
            console.error('Parse error:', error || data?.error);
            toast.error(data?.error || "Errore durante l'elaborazione del file");
            setIsProcessing(false);
            return;
          }

          if (!data.transactions || data.transactions.length === 0) {
            toast.error('Nessuna transazione valida trovata nel file');
            setIsProcessing(false);
            return;
          }

          // Store transactions for feedback modal
          setParsedTransactions(data.transactions);
          
          // Show success toast with stats
          toast.success(data.message, {
            description: `${data.stats.expenses} spese, ${data.stats.income} entrate`,
            duration: 5000,
          });

          // Refresh expenses query
          queryClient.invalidateQueries({ queryKey: ['expenses'] });

          // Show feedback modal for corrections
          setShowFeedbackModal(true);
          setIsProcessing(false);
        } catch (err) {
          clearInterval(progressInterval);
          toast.dismiss(toastId);
          console.error('Processing error:', err);
          toast.error('Errore nell\'elaborazione del file');
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        toast.error('Errore nella lettura del file');
        setIsProcessing(false);
      };

      reader.readAsText(file);

    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Errore nell\'elaborazione del file');
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="glass-card p-6 animate-fade-in">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Import CSV / Excel con AI
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Carica il file delle tue transazioni per l'analisi automatica
              </p>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </Badge>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Funzionalità Smart:</strong> Rilevamento automatico colonne, categorizzazione AI con feedback loop
            </AlertDescription>
          </Alert>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-border'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />

          {isProcessing ? (
            <div className="space-y-2">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
              <p className="text-sm font-medium">Elaborazione in corso...</p>
              <p className="text-xs text-muted-foreground">Parsing e categorizzazione AI</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-medium">
                  Trascina qui il tuo file CSV o Excel
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  oppure clicca per selezionare (max 5MB)
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                Seleziona File
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <p className="font-medium">Formati Supportati</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">.csv</Badge>
              <Badge variant="secondary" className="text-xs">.xlsx</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Rilevamento Automatico</p>
            <p className="text-muted-foreground text-xs">
              Trova automaticamente colonne data, descrizione e importo
            </p>
          </div>
        </div>
      </div>
    </Card>

    {/* AI Feedback Modal */}
    <AIFeedbackModal 
      open={showFeedbackModal}
      onClose={() => setShowFeedbackModal(false)}
      transactions={parsedTransactions}
    />
  </>
  );
};
