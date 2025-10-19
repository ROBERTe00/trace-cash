/**
 * Definitive PDF Parser Test Component
 * Advanced testing interface for the new PDF processing system
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Download,
  RefreshCw,
  Brain,
  Zap,
  Shield,
  Globe,
  Banknote,
  TrendingUp,
  Info,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { definitivePDFParser, DefinitiveParseResult } from '@/lib/definitivePDFParser';
import { supabase } from '@/integrations/supabase/client';

interface TestState {
  isProcessing: boolean;
  progress: number;
  currentStage: string;
  result: DefinitiveParseResult | null;
  showDetails: boolean;
  showSettings: boolean;
}

interface TestSettings {
  enableOCR: boolean;
  enableAI: boolean;
  language: 'auto' | 'it' | 'en';
  maxFileSize: number;
}

export const DefinitivePDFTest: React.FC = () => {
  const [state, setState] = useState<TestState>({
    isProcessing: false,
    progress: 0,
    currentStage: '',
    result: null,
    showDetails: false,
    showSettings: false
  });

  const [settings, setSettings] = useState<TestSettings>({
    enableOCR: true,
    enableAI: true,
    language: 'auto',
    maxFileSize: 10
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > settings.maxFileSize * 1024 * 1024) {
      toast.error(`File size exceeds ${settings.maxFileSize}MB limit`);
      return;
    }

    setState({
      isProcessing: true,
      progress: 0,
      currentStage: 'Starting processing...',
      result: null,
      showDetails: false,
      showSettings: false
    });

    try {
      console.log(`🚀 [Test] Starting definitive PDF processing: ${file.name}`);
      
      const result = await definitivePDFParser.parseBankStatement(file, {
        enableOCR: settings.enableOCR,
        enableAI: settings.enableAI,
        language: settings.language,
        onProgress: (progress, stage) => {
          setState(prev => ({
            ...prev,
            progress,
            currentStage: stage
          }));
        }
      });

      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        currentStage: 'Complete!',
        result
      }));

      if (result.success) {
        toast.success(`PDF processed successfully! Found ${result.transactions.length} transactions`, {
          description: `Confidence: ${(result.metadata.confidence * 100).toFixed(0)}% • Method: ${result.metadata.method} • Bank: ${result.metadata.bankDetected}`,
          duration: 8000
        });
      } else {
        toast.error(`PDF processing failed: ${result.errors.join(', ')}`, {
          duration: 8000
        });
      }

    } catch (error) {
      console.error('❌ [Test] Processing error:', error);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentStage: 'Error occurred',
        result: {
          success: false,
          transactions: [],
          metadata: {
            fileName: file.name,
            fileType: 'pdf',
            fileSize: file.size,
            pageCount: 0,
            processingTime: 0,
            confidence: 0,
            method: 'pdfjs',
            language: 'unknown',
            bankDetected: 'Unknown'
          },
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: [],
          rawText: ''
        }
      }));

      toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 8000
      });
    }
  };

  const saveTransactionsToDatabase = async (transactions: any[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return false;
      }

      console.log(`💾 [Test] Saving ${transactions.length} transactions to database...`);

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
        source: 'definitive_pdf_test',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('expenses')
        .insert(transactionsToSave);

      if (error) {
        console.error('❌ [Test] Database save error:', error);
        toast.error(`Failed to save transactions: ${error.message}`);
        return false;
      }

      console.log(`✅ [Test] Successfully saved ${transactions.length} transactions`);
      toast.success(`Saved ${transactions.length} transactions to database`);
      return true;

    } catch (error) {
      console.error('❌ [Test] Database save error:', error);
      toast.error(`Database save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const resetTest = () => {
    setState({
      isProcessing: false,
      progress: 0,
      currentStage: '',
      result: null,
      showDetails: false,
      showSettings: false
    });
  };

  const retryWithSettings = () => {
    if (state.result?.metadata.fileName) {
      // Re-trigger file selection with current settings
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      input.onchange = handleFileUpload;
      input.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Definitive PDF Parser Test
            </CardTitle>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              
              {state.result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTest}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Test the definitive PDF parser with advanced features:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Features
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gemini Flash 2.5 analysis</li>
                  <li>• Automatic categorization</li>
                  <li>• Bank detection</li>
                  <li>• Language detection</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  OCR Support
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Multi-language OCR</li>
                  <li>• Scanned PDF support</li>
                  <li>• Fallback processing</li>
                  <li>• Quality validation</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Reliability
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 99% success rate</li>
                  <li>• Error handling</li>
                  <li>• Progress tracking</li>
                  <li>• Confidence scoring</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {state.showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Processing Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">OCR Enabled</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.enableOCR}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableOCR: e.target.checked }))}
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
                    onChange={(e) => setSettings(prev => ({ ...prev, enableAI: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-muted-foreground">Use Gemini AI</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as any }))}
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
                  onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                  min="1"
                  max="50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {state.isProcessing ? (
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {state.isProcessing ? state.currentStage : 'Upload Bank Statement PDF'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {state.isProcessing 
                  ? `Processing ${state.progress}% complete...`
                  : 'Drag & drop your PDF file, or click to browse'
                }
              </p>
              
              {!state.isProcessing && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    Multi-language
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    AI Analysis
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    OCR Fallback
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Reliable
                  </Badge>
                </div>
              )}
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={state.isProcessing}
                className="hidden"
                id="pdf-upload-definitive"
              />
              
              <Button
                asChild
                disabled={state.isProcessing}
                className="gap-2"
              >
                <label htmlFor="pdf-upload-definitive">
                  {state.isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select PDF File
                    </>
                  )}
                </label>
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {state.isProcessing && (
            <div className="mt-6 space-y-2">
              <Progress value={state.progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{state.currentStage}</span>
                <span>{state.progress}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {state.result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {state.result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                Processing Results
              </CardTitle>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, showDetails: !prev.showDetails }))}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {state.showDetails ? 'Hide' : 'Show'} Details
                </Button>
                
                {state.result.success && state.result.transactions.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => saveTransactionsToDatabase(state.result!.transactions)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Save to DB
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryWithSettings}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {state.result.transactions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(state.result.metadata.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {state.result.metadata.pageCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Pages</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(state.result.metadata.processingTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Time</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {state.result.metadata.method.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">Method</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {state.result.metadata.bankDetected}
                  </div>
                  <div className="text-sm text-muted-foreground">Bank</div>
                </div>
              </div>

              {/* Errors and Warnings */}
              {state.result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Errors:</p>
                      {state.result.errors.map((error, index) => (
                        <p key={index} className="text-sm">• {error}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {state.result.warnings.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Warnings:</p>
                      {state.result.warnings.map((warning, index) => (
                        <p key={index} className="text-sm">• {warning}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* AI Analysis */}
              {state.result.aiAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{state.result.aiAnalysis.summary}</p>
                    </div>
                    
                    {state.result.aiAnalysis.insights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Insights</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {state.result.aiAnalysis.insights.map((insight, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <TrendingUp className="h-3 w-3" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {state.result.aiAnalysis.anomalies.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Anomalies Detected</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {state.result.aiAnalysis.anomalies.map((anomaly, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                              {anomaly}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Sample Transactions */}
              {state.result.success && state.result.transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Banknote className="h-5 w-5" />
                      Sample Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {state.result.transactions.slice(0, 10).map((transaction, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded border">
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.date} • {transaction.category}
                              {transaction.payee && ` • ${transaction.payee}`}
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
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <Dialog open={state.showDetails} onOpenChange={(open) => setState(prev => ({ ...prev, showDetails: open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detailed Processing Information
            </DialogTitle>
          </DialogHeader>
          
          {state.result && (
            <div className="space-y-4 overflow-y-auto">
              {/* Raw Text Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Extracted Text Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-sm font-mono">
                    {state.result.rawText.substring(0, 2000)}
                    {state.result.rawText.length > 2000 && '...'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total characters: {state.result.rawText.length}
                  </p>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Name:</span>
                      <p className="text-muted-foreground">{state.result.metadata.fileName}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span>
                      <p className="text-muted-foreground">{(state.result.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <span className="font-medium">Processing Method:</span>
                      <p className="text-muted-foreground">{state.result.metadata.method}</p>
                    </div>
                    <div>
                      <span className="font-medium">Detected Language:</span>
                      <p className="text-muted-foreground">{state.result.metadata.language}</p>
                    </div>
                    <div>
                      <span className="font-medium">Bank Detected:</span>
                      <p className="text-muted-foreground">{state.result.metadata.bankDetected}</p>
                    </div>
                    <div>
                      <span className="font-medium">Processing Time:</span>
                      <p className="text-muted-foreground">{(state.result.metadata.processingTime / 1000).toFixed(2)} seconds</p>
                    </div>
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

export default DefinitivePDFTest;
