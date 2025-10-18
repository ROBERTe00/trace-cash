/**
 * Enhanced Upload Component with Advanced Features
 * Drag & drop, progress indicators, error handling, AI processing
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { geminiAI, TransactionAnalysis } from '@/lib/geminiAI';

interface EnhancedUploadProps {
  onAnalysisComplete: (analysis: TransactionAnalysis) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  enableAI?: boolean;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  stage: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  fileName?: string;
  fileSize?: number;
  error?: string;
  analysis?: TransactionAnalysis;
}

const STAGES = {
  idle: { label: 'Ready to Upload', icon: Upload, color: 'text-muted-foreground' },
  uploading: { label: 'Uploading File', icon: Upload, color: 'text-blue-500' },
  processing: { label: 'Processing Document', icon: FileText, color: 'text-yellow-500' },
  analyzing: { label: 'AI Analysis', icon: Brain, color: 'text-purple-500' },
  complete: { label: 'Analysis Complete', icon: CheckCircle, color: 'text-green-500' },
  error: { label: 'Upload Failed', icon: AlertCircle, color: 'text-red-500' }
};

export const EnhancedUpload: React.FC<EnhancedUploadProps> = ({
  onAnalysisComplete,
  onError,
  maxFileSize = 10,
  acceptedFormats = ['.pdf', '.csv', '.xlsx', '.xls'],
  enableAI = true
}) => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    stage: 'idle'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProgress = useCallback((progress: number, stage: UploadState['stage']) => {
    setState(prev => ({ ...prev, progress, stage }));
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!enableAI) {
      onError('AI processing is disabled');
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

      const fileType = file.name.endsWith('.pdf') ? 'pdf' : 
                     file.name.endsWith('.csv') ? 'csv' : 'excel';

      // Stage 2: Read file content
      updateProgress(30, 'processing');
      const fileContent = await readFileContent(file, fileType);

      // Stage 3: AI Processing
      updateProgress(50, 'analyzing');
      const analysis = await geminiAI.processFinancialDocument(
        fileContent,
        fileType,
        'current-user', // TODO: Get actual user ID
        {
          enableAnomalyDetection: true,
          enableInsights: true,
          enableSummarization: true
        }
      );

      // Stage 4: Complete
      updateProgress(100, 'complete');
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        stage: 'complete',
        analysis
      }));

      onAnalysisComplete(analysis);
      
      toast.success('File processed successfully!', {
        description: `Found ${analysis.transactions.length} transactions`,
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

      onError(errorMessage);
      toast.error('Processing failed', {
        description: errorMessage,
        duration: 5000
      });
    }
  }, [enableAI, maxFileSize, onAnalysisComplete, onError, updateProgress]);

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

  const currentStage = STAGES[state.stage];
  const StageIcon = currentStage.icon;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <Card className="relative overflow-hidden border-2 border-dashed transition-all duration-300 hover:border-primary/50">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              relative cursor-pointer transition-all duration-300
              ${isDragActive ? 'scale-105' : ''}
              ${state.isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} onChange={handleFileSelect} />
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-lg" />
            
            {/* Upload Content */}
            <div className="relative text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <motion.div
                  animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-primary/10 rounded-full"
                >
                  <Upload className="w-12 h-12 text-primary" />
                </motion.div>
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  {isDragActive ? 'Drop your file here' : 'Upload Financial Document'}
                </h3>
                <p className="text-muted-foreground">
                  Drag & drop your PDF, CSV, or Excel file, or click to browse
                </p>
              </div>

              {/* File Info */}
              {state.fileName && (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {state.fileName} ({(state.fileSize! / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}

              {/* Supported Formats */}
              <div className="flex flex-wrap justify-center gap-2">
                {acceptedFormats.map(format => (
                  <Badge key={format} variant="secondary" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>

              {/* AI Features */}
              {enableAI && (
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span>AI Analysis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Anomaly Detection</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span>Smart Insights</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <AnimatePresence>
        {state.isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6"
          >
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Stage Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-primary/10`}>
                        <StageIcon className={`w-5 h-5 ${currentStage.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{currentStage.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {state.fileName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {state.progress}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={state.progress} className="h-3" />

                  {/* Stage-specific content */}
                  {state.stage === 'analyzing' && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>AI is analyzing your financial data...</span>
                    </div>
                  )}

                  {state.stage === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <Zap className="w-4 h-4 animate-pulse" />
                      <span>Extracting transactions from document...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {state.stage === 'complete' && state.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6"
          >
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        Analysis Complete!
                      </h4>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Your financial data has been processed successfully
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="text-green-600 hover:text-green-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {state.analysis.transactions.length}
                    </div>
                    <div className="text-xs text-green-600">Transactions</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      €{Math.abs(state.analysis.summary.totalExpenses).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">Total Expenses</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {state.analysis.insights.length}
                    </div>
                    <div className="text-xs text-green-600">AI Insights</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(state.analysis.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-green-600">Confidence</div>
                  </div>
                </div>

                {/* Top Insights Preview */}
                {state.analysis.insights.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-green-800 dark:text-green-200">
                      Key Insights:
                    </h5>
                    {state.analysis.insights.slice(0, 2).map((insight, index) => (
                      <div key={index} className="text-sm text-green-700 dark:text-green-300">
                        • {insight.title}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Section */}
      <AnimatePresence>
        {state.stage === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{state.error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="text-red-600 hover:text-red-700"
                  >
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to read file content
async function readFileContent(file: File, fileType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    if (fileType === 'pdf') {
      // For PDF, we'll need to handle this differently
      // This is a simplified version - in production, you'd use a PDF parser
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export default EnhancedUpload;
