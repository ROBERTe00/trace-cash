/**
 * PDF Parser Test Component
 * Component for testing PDF parsing functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { fileParser } from '@/lib/fileParsers';

interface TestResult {
  success: boolean;
  transactions: any[];
  metadata: any;
  errors: string[];
  warnings: string[];
}

export const PDFParserTest: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const parseResult = await fileParser.parseFile(file, {
        enableOCR: true,
        enableAI: true,
        maxFileSize: 10 * 1024 * 1024,
        timeout: 180
      });

      clearInterval(progressInterval);
      setProgress(100);

      setResult({
        success: parseResult.success,
        transactions: parseResult.transactions,
        metadata: parseResult.metadata,
        errors: parseResult.errors,
        warnings: parseResult.warnings
      });

      if (parseResult.success) {
        toast.success(`PDF parsed successfully! Found ${parseResult.transactions.length} transactions`);
      } else {
        toast.error(`PDF parsing failed: ${parseResult.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('PDF parsing error:', error);
      toast.error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      setResult({
        success: false,
        transactions: [],
        metadata: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTest = () => {
    setResult(null);
    setProgress(0);
    setShowDetails(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Parser Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Test the PDF parser with your bank statement. The parser supports:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Supported Banks</h4>
                <div className="flex flex-wrap gap-2">
                  {['Intesa Sanpaolo', 'UniCredit', 'Poste Italiane', 'BNL'].map(bank => (
                    <Badge key={bank} variant="outline">{bank}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Text extraction with PDF.js</li>
                  <li>• OCR fallback for scanned PDFs</li>
                  <li>• Bank-specific pattern recognition</li>
                  <li>• Transaction parsing and categorization</li>
                </ul>
              </div>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Upload Bank Statement PDF</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a PDF file to test the parser
                  </p>
                  
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                    id="pdf-upload"
                  />
                  
                  <Button
                    asChild
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    <label htmlFor="pdf-upload">
                      {isProcessing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {isProcessing ? 'Processing...' : 'Select PDF File'}
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing PDF...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                Test Results
              </CardTitle>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTest}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {result.transactions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.metadata?.confidence ? Math.round(result.metadata.confidence * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {result.metadata?.pageCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Pages</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {result.metadata?.processingTime ? Math.round(result.metadata.processingTime / 1000) : 0}s
                  </div>
                  <div className="text-sm text-muted-foreground">Processing Time</div>
                </div>
              </div>

              {/* Errors and Warnings */}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Errors:</p>
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-sm">• {error}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Warnings:</p>
                      {result.warnings.map((warning, index) => (
                        <p key={index} className="text-sm">• {warning}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Sample Transactions */}
              {result.success && result.transactions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Sample Transactions</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.transactions.slice(0, 10).map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded border">
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
                </div>
              )}

              {/* Detailed Information */}
              {showDetails && result.metadata && (
                <div className="space-y-4">
                  <h4 className="font-medium">Detailed Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Name:</span>
                      <p className="text-muted-foreground">{result.metadata.fileName}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Type:</span>
                      <p className="text-muted-foreground">{result.metadata.fileType?.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span>
                      <p className="text-muted-foreground">{(result.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <span className="font-medium">Processing Time:</span>
                      <p className="text-muted-foreground">{(result.metadata.processingTime / 1000).toFixed(2)}s</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFParserTest;
