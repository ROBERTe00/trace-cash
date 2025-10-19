/**
 * Unified File Upload Component
 * Advanced drag & drop with robust parsing and comprehensive error handling
 */

import React, { useState, useCallback, useRef } from 'react';
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
import { fileParser, ParseResult } from '@/lib/fileParsers';
import { ParsedTransaction } from '@/lib/geminiAI';

interface UnifiedUploadProps {
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
  stage: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  fileName?: string;
  fileSize?: number;
  error?: string;
  result?: ParseResult;
}

const STAGES = {
  idle: { label: 'Ready to Upload', icon: Upload, color: 'text-muted-foreground' },
  uploading: { label: 'Uploading File', icon: Upload, color: 'text-blue-500' },
  processing: { label: 'Processing Document', icon: FileText, color: 'text-yellow-500' },
  analyzing: { label: 'AI Analysis', icon: Brain, color: 'text-purple-500' },
  complete: { label: 'Analysis Complete', icon: CheckCircle, color: 'text-green-500' },
  error: { label: 'Upload Failed', icon: AlertCircle, color: 'text-red-500' }
};

export const UnifiedUpload: React.FC<UnifiedUploadProps> = ({
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProgress = useCallback((progress: number, stage: UploadState['stage']) => {
    setState(prev => ({ ...prev, progress, stage }));
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!enableAI) {
      onError?.('AI processing is disabled');
      return;
    }

    setState({
      isUploading: true,
      progress: 0,
      stage: 'uploading',
      fileName: file.name,
      fileSize: file.size
    });

    try {
      // Stage 1: File validation and reading
      updateProgress(10, 'uploading');
      
      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxFileSize}MB`);
      }

      // Stage 2: Parse file
      updateProgress(30, 'processing');
      const result = await fileParser.parseFile(file, {
        enableOCR,
        enableAI,
        maxFileSize: maxFileSize * 1024 * 1024,
        timeout: 180
      });

      // Stage 3: AI Processing (if enabled)
      if (enableAI && result.success) {
        updateProgress(70, 'analyzing');
        // AI processing is handled within fileParser
      }

      // Stage 4: Complete
      updateProgress(100, 'complete');
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        stage: 'complete',
        result
      }));

      if (result.success && result.transactions.length > 0) {
        onTransactionsParsed(result.transactions, result.metadata);
        
        toast.success('File processed successfully!', {
          description: `Found ${result.transactions.length} transactions with ${(result.metadata.confidence * 100).toFixed(0)}% confidence`,
          duration: 5000
        });
      } else {
        throw new Error(result.errors.join(', ') || 'No transactions found');
      }

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retryUpload = () => {
    if (state.fileName) {
      // Re-trigger file selection
      fileInputRef.current?.click();
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
              ref={fileInputRef}
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
                      Max file size: {maxFileSize}MB • AI-powered processing
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
                      Successfully processed {state.result.transactions.length} transactions
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
              {state.result.warnings.map((warning, index) => (
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
                    {state.result.transactions.slice(0, 10).map((transaction, index) => (
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

export default UnifiedUpload;
