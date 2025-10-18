import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Loader2, AlertCircle, Sparkles, Brain, Shield, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AIFeedbackModal } from "@/components/AIFeedbackModal";
import { useQueryClient } from "@tanstack/react-query";
import { geminiAI, TransactionAnalysis } from "@/lib/geminiAI";
import { AdvancedInsights } from "@/components/AdvancedInsights";

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
  const [aiAnalysis, setAiAnalysis] = useState<TransactionAnalysis | null>(null);
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(false);
  const [processingStage, setProcessingStage] = useState<'uploading' | 'processing' | 'analyzing' | 'complete'>('uploading');
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
          // Stage 1: Basic parsing
          setProcessingStage('processing');
          const { data, error } = await supabase.functions.invoke('parse-smart-transactions', {
            body: {
              fileContent,
              fileType,
              userId: user.id,
            },
          });

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

          // Stage 2: Advanced AI Analysis
          setProcessingStage('analyzing');
          try {
            const analysis = await geminiAI.processFinancialDocument(
              fileContent,
              fileType,
              user.id,
              {
                enableAnomalyDetection: true,
                enableInsights: true,
                enableSummarization: true
              }
            );

            setAiAnalysis(analysis);
            
            // Show success toast with enhanced stats
            toast.success('File processed with AI analysis!', {
              description: `${analysis.transactions.length} transactions, ${analysis.insights.length} insights, ${analysis.anomalies.length} anomalies`,
              duration: 5000,
            });

          } catch (aiError) {
            console.warn('AI analysis failed, using basic results:', aiError);
            // Fallback to basic results if AI fails
            setParsedTransactions(data.transactions);
            toast.success(data.message, {
              description: `${data.stats.expenses} spese, ${data.stats.income} entrate`,
              duration: 5000,
            });
          }

          clearInterval(progressInterval);
          toast.dismiss(toastId);

          // Store transactions for feedback modal
          setParsedTransactions(data.transactions);
          
          // Refresh expenses query
          queryClient.invalidateQueries({ queryKey: ['expenses'] });

          // Show feedback modal for corrections
          setShowFeedbackModal(true);
          setProcessingStage('complete');
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

    {/* Advanced AI Insights */}
    {aiAnalysis && (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Analysis Results</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedInsights(!showAdvancedInsights)}
            >
              {showAdvancedInsights ? 'Hide Details' : 'View Details'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiAnalysis(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {aiAnalysis.transactions.length}
            </div>
            <div className="text-xs text-muted-foreground">Transactions</div>
          </div>
          
          <div className="text-center p-3 bg-green-500/5 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {aiAnalysis.insights.length}
            </div>
            <div className="text-xs text-muted-foreground">AI Insights</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-500/5 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {aiAnalysis.anomalies.length}
            </div>
            <div className="text-xs text-muted-foreground">Anomalies</div>
          </div>
          
          <div className="text-center p-3 bg-blue-500/5 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {(aiAnalysis.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
        </div>

        {/* AI Features Preview */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Brain className="w-4 h-4 text-purple-500" />
            <span>Smart Analysis</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Anomaly Detection</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>Financial Insights</span>
          </div>
        </div>

        {/* Top Insights Preview */}
        {aiAnalysis.insights.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium">Key Insights:</h4>
            {aiAnalysis.insights.slice(0, 2).map((insight, index) => (
              <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                <strong>{insight.title}:</strong> {insight.description}
              </div>
            ))}
            {aiAnalysis.insights.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{aiAnalysis.insights.length - 2} more insights available
              </p>
            )}
          </div>
        )}

        {/* Detailed Analysis */}
        {showAdvancedInsights && (
          <AdvancedInsights
            insights={aiAnalysis.insights}
            anomalies={aiAnalysis.anomalies}
            summary={aiAnalysis.summary}
            onInsightAction={(insight, action) => {
              console.log('Insight action:', insight.title, action);
              toast.info(`Applied action: ${action}`, {
                description: insight.title
              });
            }}
            onAnomalyAction={(anomaly, action) => {
              console.log('Anomaly action:', anomaly.type, action);
              toast.info(`Anomaly action: ${action}`, {
                description: anomaly.description
              });
            }}
          />
        )}
      </div>
    )}
  </>
  );
};
