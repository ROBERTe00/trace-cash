/**
 * Frontend-Only File Processing System
 * Bypasses Edge Functions to process files directly in the browser
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Sparkles,
  BarChart3,
  Brain,
  Shield,
  Zap,
  Download,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { fileParser } from '@/lib/fileParsers';
import { ParsedTransaction } from '@/lib/geminiAI';
import { supabase } from '@/integrations/supabase/client';

interface FrontendUploadProps {
  onTransactionsParsed: (transactions: ParsedTransaction[], metadata: any) => void;
  onError?: (error: string) => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  enableAI?: boolean;
  enableOCR?: boolean;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  stage: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'saving' | 'complete' | 'error';
  fileName?: string;
  fileSize?: number;
  error?: string;
  result?: any;
}

const STAGES = {
  idle: { label: 'Ready to Upload', icon: Upload, color: 'text-muted-foreground' },
  uploading: { label: 'Reading File', icon: Upload, color: 'text-blue-500' },
  processing: { label: 'Processing Document', icon: FileText, color: 'text-yellow-500' },
  analyzing: { label: 'AI Analysis', icon: Brain, color: 'text-purple-500' },
  saving: { label: 'Saving to Database', icon: Shield, color: 'text-green-500' },
  complete: { label: 'Analysis Complete', icon: CheckCircle, color: 'text-green-500' },
  error: { label: 'Upload Failed', icon: AlertCircle, color: 'text-red-500' }
};

export const FrontendUpload: React.FC<FrontendUploadProps> = ({
  onTransactionsParsed,
  onError,
  maxFileSize = 10,
  acceptedFormats = ['.pdf', '.csv', '.xlsx', '.xls'],
  enableAI = true,
  enableOCR = true
}) => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    stage: 'idle'
  });

  const [showDetails, setShowDetails] = useState(false);

  const updateProgress = useCallback((progress: number, stage: UploadState['stage']) => {
    setState(prev => ({ ...prev, progress, stage }));
  }, []);

  const saveTransactionsToDatabase = async (transactions: ParsedTransaction[], metadata: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log(`💾 Saving ${transactions.length} transactions to database...`);

      // Prepare transactions for database
      const transactionsToSave = transactions.map(transaction => ({
        user_id: user.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        payee: transaction.payee,
        merchant: transaction.merchant,
        location: transaction.location,
        confidence: transaction.confidence,
        tags: transaction.tags || [],
        source: 'file_upload',
        created_at: new Date().toISOString()
      }));

      // Insert transactions in batches
      const batchSize = 100;
      for (let i = 0; i < transactionsToSave.length; i += batchSize) {
        const batch = transactionsToSave.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('expenses')
          .insert(batch);

        if (error) {
          console.error('Error saving batch:', error);
          throw new Error(`Failed to save transactions: ${error.message}`);
        }

        // Update progress
        const batchProgress = Math.round(((i + batch.length) / transactionsToSave.length) * 20); // 20% for saving
        updateProgress(80 + batchProgress, 'saving');
      }

      console.log(`✅ Successfully saved ${transactions.length} transactions`);
      return true;

    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  };

  const processFile = useCallback(async (file: File) => {
    setState({
      isUploading: true,
      progress: 0,
      stage: 'uploading',
      fileName: file.name,
      fileSize: file.size
    });

    try {
      // Stage 1: File validation
      updateProgress(10, 'uploading');
      
      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxFileSize}MB`);
      }

      // Stage 2: Parse file (frontend only)
      updateProgress(30, 'processing');
      console.log(`📄 Starting frontend-only parsing for: ${file.name}`);
      
      const result = await fileParser.parseFile(file, {
        enableOCR,
        enableAI,
        maxFileSize: maxFileSize * 1024 * 1024,
        timeout: 180
      });

      console.log(`✅ Frontend parsing completed:`, {
        success: result.success,
        transactionsFound: result.transactions.length,
        confidence: result.metadata.confidence,
        method: result.metadata.fileType
      });

      if (!result.success || result.transactions.length === 0) {
        throw new Error(result.errors.join(', ') || 'No transactions found in file');
      }

      // Stage 3: Save to database
      updateProgress(80, 'saving');
      await saveTransactionsToDatabase(result.transactions, result.metadata);

      // Stage 4: Complete
      updateProgress(100, 'complete');
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        stage: 'complete',
        result
      }));

      onTransactionsParsed(result.transactions, result.metadata);
      
      toast.success('File processed successfully!', {
        description: `Found and saved ${result.transactions.length} transactions with ${(result.metadata.confidence * 100).toFixed(0)}% confidence`,
        duration: 5000
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        stage: 'error',
        error: errorMessage
      }));

      onError?.(errorMessage);
      toast.error('Processing failed', {
        description: errorMessage,
        duration: 5000
      });
    }
  }, [enableAI, enableOCR, maxFileSize, onTransactionsParsed, onError, updateProgress]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: state.isUploading
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const resetUpload = () => {
    setState({
      isUploading: false,
      progress: 0,
      stage: 'idle'
    });
  };

  const retryUpload = () => {
    if (state.fileName) {
      // Re-trigger file selection
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptedFormats.join(',');
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) processFile(file);
      };
      input.click();
    }
  };

  const currentStage = STAGES[state.stage];
  const StageIcon = currentStage.icon;

  return (
    <div className="space-y-4">
      {/* Main Upload Area */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${state.isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input
              {...getInputProps()}
              onChange={handleFileSelect}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {state.stage === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isDragActive ? 'Drop your file here' : 'Upload Bank Statement'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Drag & drop your PDF, Excel, or CSV file, or click to browse
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {acceptedFormats.map(format => (
                        <Badge key={format} variant="secondary" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Max file size: {maxFileSize}MB • Frontend processing • No server upload
                    </p>
                  </div>
                </motion.div>
              )}

              {state.isUploading && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <StageIcon className={`h-8 w-8 ${currentStage.color}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{currentStage.label}</h3>
                    <p className="text-muted-foreground mb-4">
                      {state.fileName} ({(state.fileSize! / (1024 * 1024)).toFixed(1)}MB)
                    </p>
                    
                    <Progress value={state.progress} className="h-2 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {state.progress}% complete
                    </p>
                  </div>
                </motion.div>
              )}

              {state.stage === 'complete' && state.result && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-green-600">
                      Processing Complete!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Successfully processed and saved {state.result.transactions.length} transactions
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Confidence: {(state.result.metadata.confidence * 100).toFixed(0)}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {state.result.metadata.rowCount} rows processed
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {(state.result.metadata.processingTime / 1000).toFixed(1)}s
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Frontend Only
                      </Badge>
                    </div>
                    
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDetails(true)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetUpload}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Another
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {state.stage === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-red-600">
                      Processing Failed
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {state.error}
                    </p>
                    
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryUpload}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetUpload}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {state.result?.warnings && state.result.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Processing Warnings:</p>
              {state.result.warnings.map((warning: string, index: number) => (
                <p key={index} className="text-sm">• {warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Processing Details
            </DialogTitle>
          </DialogHeader>
          
          {state.result && (
            <div className="space-y-4 overflow-y-auto">
              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Name:</span>
                      <p className="text-muted-foreground">{state.result.metadata.fileName}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Type:</span>
                      <p className="text-muted-foreground">{state.result.metadata.fileType.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span>
                      <p className="text-muted-foreground">{(state.result.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <span className="font-medium">Processing Time:</span>
                      <p className="text-muted-foreground">{(state.result.metadata.processingTime / 1000).toFixed(2)}s</p>
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <p className="text-muted-foreground">{(state.result.metadata.confidence * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="font-medium">Transactions Found:</span>
                      <p className="text-muted-foreground">{state.result.transactions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sample Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sample Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {state.result.transactions.slice(0, 10).map((transaction: ParsedTransaction, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded border">
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.date} • {transaction.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            €{Math.abs(transaction.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(transaction.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FrontendUpload;
