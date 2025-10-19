/**
 * PDF Debug Component
 * Detailed debugging for PDF extraction issues
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, AlertCircle, RefreshCw, Eye, FileText, Bug } from 'lucide-react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DebugResult {
  fileName: string;
  fileSize: number;
  pdfInfo: {
    pages: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  extractionResults: {
    pageResults: Array<{
      pageNumber: number;
      textLength: number;
      textPreview: string;
      success: boolean;
      error?: string;
    }>;
    totalTextLength: number;
    successfulPages: number;
  };
  errors: string[];
}

export const PDFDebug: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debugPDF = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      console.log(`🐛 [PDF Debug] Starting debug for: ${file.name}`);
      
      const arrayBuffer = await file.arrayBuffer();
      setProgress(20);
      
      console.log(`🐛 [PDF Debug] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
      
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0
      }).promise;
      
      setProgress(40);
      
      const pageCount = pdf.numPages;
      console.log(`🐛 [PDF Debug] PDF loaded: ${pageCount} pages`);
      
      // Get PDF metadata
      const metadata = await pdf.getMetadata();
      const info = pdf.getMetadata().info;
      
      setProgress(60);
      
      const pageResults = [];
      let totalTextLength = 0;
      let successfulPages = 0;
      
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        try {
          console.log(`🐛 [PDF Debug] Processing page ${pageNum}/${pageCount}`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim();
          
          pageResults.push({
            pageNumber: pageNum,
            textLength: pageText.length,
            textPreview: pageText.substring(0, 200),
            success: true
          });
          
          totalTextLength += pageText.length;
          if (pageText.length > 0) successfulPages++;
          
          console.log(`🐛 [PDF Debug] Page ${pageNum}: ${pageText.length} chars`);
          
        } catch (pageError) {
          console.log(`🐛 [PDF Debug] Error on page ${pageNum}:`, pageError);
          pageResults.push({
            pageNumber: pageNum,
            textLength: 0,
            textPreview: '',
            success: false,
            error: pageError instanceof Error ? pageError.message : 'Unknown error'
          });
        }
        
        setProgress(60 + (pageNum / pageCount) * 30);
      }
      
      const debugResult: DebugResult = {
        fileName: file.name,
        fileSize: file.size,
        pdfInfo: {
          pages: pageCount,
          title: info.Title,
          author: info.Author,
          subject: info.Subject,
          creator: info.Creator,
          producer: info.Producer,
          creationDate: info.CreationDate,
          modificationDate: info.ModDate
        },
        extractionResults: {
          pageResults,
          totalTextLength,
          successfulPages
        },
        errors: []
      };
      
      setResult(debugResult);
      setProgress(100);
      
      console.log(`🐛 [PDF Debug] Debug complete:`, debugResult);
      
      toast.success(`PDF debug completed!`, {
        description: `${successfulPages}/${pageCount} pages successful, ${totalTextLength} total characters`,
        duration: 5000
      });
      
    } catch (error) {
      console.error('🐛 [PDF Debug] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`PDF debug failed: ${errorMessage}`, { duration: 8000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    await debugPDF(file);
  };

  const resetDebug = () => {
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          PDF Debug Tool
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {isProcessing ? (
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <FileText className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isProcessing ? 'Debugging PDF...' : 'Debug PDF Extraction Issues'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isProcessing 
                ? `Processing ${progress}% complete...`
                : 'Upload a PDF to see detailed extraction information and identify issues'
              }
            </p>
            
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="pdf-debug-upload"
            />
            
            <Button
              asChild
              disabled={isProcessing}
              className="gap-2"
            >
              <label htmlFor="pdf-debug-upload">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Debugging...
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

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Debug Failed:</p>
                <p className="text-sm">{error}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            {/* File Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">File Name:</span>
                    <p className="text-muted-foreground">{result.fileName}</p>
                  </div>
                  <div>
                    <span className="font-medium">File Size:</span>
                    <p className="text-muted-foreground">{(result.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <span className="font-medium">Pages:</span>
                    <p className="text-muted-foreground">{result.pdfInfo.pages}</p>
                  </div>
                  <div>
                    <span className="font-medium">Creator:</span>
                    <p className="text-muted-foreground">{result.pdfInfo.creator || 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extraction Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Extraction Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {result.extractionResults.successfulPages}/{result.pdfInfo.pages}
                    </div>
                    <div className="text-sm text-muted-foreground">Pages Successful</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {result.extractionResults.totalTextLength}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Characters</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {result.extractionResults.totalTextLength > 0 ? 'YES' : 'NO'}
                    </div>
                    <div className="text-sm text-muted-foreground">Has Text</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Page Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Page-by-Page Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.extractionResults.pageResults.map((pageResult, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Page {pageResult.pageNumber}</span>
                          {pageResult.success ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pageResult.textLength} characters
                          {pageResult.error && ` - Error: ${pageResult.error}`}
                        </p>
                        {pageResult.textPreview && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Preview: {pageResult.textPreview}...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={resetDebug} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Debug Another File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFDebug;
