/**
 * Direct PDF Test Component
 * Simple component to test PDF extraction directly
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const DirectPDFTest: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testPDF = async (file: File) => {
    setIsProcessing(true);
    setResult(null);

    try {
      console.log(`🧪 [Direct Test] Testing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log(`🧪 [Direct Test] ArrayBuffer: ${arrayBuffer.byteLength} bytes`);
      
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0
      }).promise;
      
      const pageCount = pdf.numPages;
      console.log(`🧪 [Direct Test] Pages: ${pageCount}`);
      
      let allText = '';
      let pageResults = [];
      
      for (let i = 1; i <= pageCount; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim();
          
          pageResults.push({
            page: i,
            textLength: pageText.length,
            text: pageText.substring(0, 100) + (pageText.length > 100 ? '...' : ''),
            success: true
          });
          
          allText += pageText + '\n';
          console.log(`🧪 [Direct Test] Page ${i}: ${pageText.length} chars`);
          
        } catch (error) {
          pageResults.push({
            page: i,
            textLength: 0,
            text: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.log(`🧪 [Direct Test] Page ${i} error:`, error);
        }
      }
      
      const testResult = {
        fileName: file.name,
        fileSize: file.size,
        pageCount,
        totalTextLength: allText.length,
        pageResults,
        fullText: allText.substring(0, 1000) + (allText.length > 1000 ? '...' : ''),
        success: allText.length > 0
      };
      
      setResult(testResult);
      
      if (allText.length > 0) {
        toast.success(`PDF test successful! Found ${allText.length} characters`);
      } else {
        toast.error('No text found in PDF - likely a scanned document');
      }
      
    } catch (error) {
      console.error('🧪 [Direct Test] Error:', error);
      toast.error(`PDF test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    await testPDF(file);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Direct PDF Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isProcessing ? 'Testing PDF...' : 'Test PDF Extraction'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Upload your PDF to see if text can be extracted
            </p>
            
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="direct-pdf-test"
            />
            
            <Button
              asChild
              disabled={isProcessing}
              className="gap-2"
            >
              <label htmlFor="direct-pdf-test">
                {isProcessing ? 'Testing...' : 'Select PDF File'}
              </label>
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">
                    {result.success ? 'PDF Test Successful' : 'PDF Test Failed'}
                  </p>
                  <p className="text-sm">
                    File: {result.fileName} ({(result.fileSize / 1024 / 1024).toFixed(2)}MB)
                  </p>
                  <p className="text-sm">
                    Pages: {result.pageCount} | Text: {result.totalTextLength} characters
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">Page Results:</h4>
              {result.pageResults.map((page: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 rounded border">
                  <div>
                    <span className="font-medium">Page {page.page}</span>
                    {page.success ? (
                      <span className="ml-2 text-green-600">✓ {page.textLength} chars</span>
                    ) : (
                      <span className="ml-2 text-red-600">✗ {page.error}</span>
                    )}
                  </div>
                  {page.text && (
                    <div className="text-xs text-muted-foreground max-w-md truncate">
                      {page.text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {result.fullText && (
              <div>
                <h4 className="font-medium mb-2">Extracted Text Preview:</h4>
                <div className="max-h-32 overflow-y-auto bg-muted p-3 rounded text-sm font-mono">
                  {result.fullText}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectPDFTest;
