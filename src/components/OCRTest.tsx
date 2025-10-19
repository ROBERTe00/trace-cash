/**
 * OCR Test Component
 * Quick test to verify OCR functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

export const OCRTest: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    text: string;
    confidence: number;
    language: string;
    processingTime: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testOCR = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setError(null);

    const startTime = Date.now();

    try {
      console.log('🧪 [OCR Test] Starting OCR test...');
      
      // Test different language configurations
      const languageConfigs = ['eng', 'ita', 'eng+ita'];
      let lastError: Error | null = null;
      
      for (const lang of languageConfigs) {
        try {
          console.log(`🧪 [OCR Test] Trying language: ${lang}`);
          setProgress(10);
          
          // Create worker with timeout
          const workerPromise = Tesseract.createWorker(lang, 1, {
            logger: (m) => {
              console.log(`🧪 [OCR Test] ${m.status}: ${m.progress}`);
              if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                setProgress(20 + Math.round(m.progress * 70)); // 20-90% range
              }
            }
          });
          
          // Add timeout to worker creation
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('OCR worker creation timeout')), 30000)
          );
          
          const worker = await Promise.race([workerPromise, timeoutPromise]);
          console.log(`✅ [OCR Test] Worker created successfully with ${lang}`);

          try {
            const arrayBuffer = await file.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: file.type });
            const imageUrl = URL.createObjectURL(blob);

            console.log(`🧪 [OCR Test] Processing with ${lang}...`);
            setProgress(90);
            
            // Add timeout to recognition
            const recognitionPromise = worker.recognize(imageUrl);
            const recognitionTimeout = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('OCR recognition timeout')), 120000)
            );
            
            const { data: { text, confidence } } = await Promise.race([recognitionPromise, recognitionTimeout]);
            
            URL.revokeObjectURL(imageUrl);
            
            const processingTime = Date.now() - startTime;
            
            console.log(`✅ [OCR Test] Success with ${lang}: ${text.length} chars`);
            
            setResult({
              text: text.trim(),
              confidence: confidence / 100,
              language: lang,
              processingTime
            });
            
            setProgress(100);
            toast.success(`OCR test successful with ${lang}!`, {
              description: `Extracted ${text.length} characters in ${(processingTime / 1000).toFixed(1)}s`,
              duration: 5000
            });
            
            return; // Success, exit the loop
            
          } finally {
            await worker.terminate();
          }
          
        } catch (error) {
          console.log(`❌ [OCR Test] Failed with ${lang}:`, error);
          lastError = error instanceof Error ? error : new Error('Unknown OCR error');
          
          // If it's a timeout or language pack error, try next language
          if (error instanceof Error && (
            error.message.includes('timeout') || 
            error.message.includes('language') ||
            error.message.includes('worker')
          )) {
            continue;
          }
          
          // If it's a different error, break and throw
          throw error;
        }
      }
      
      // If all language configs failed, throw the last error
      throw lastError || new Error('All OCR language configurations failed');
      
    } catch (error) {
      console.error('❌ [OCR Test] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`OCR test failed: ${errorMessage}`, { duration: 8000 });
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

    await testOCR(file);
  };

  const resetTest = () => {
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          OCR Functionality Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {isProcessing ? (
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isProcessing ? 'Testing OCR...' : 'Test OCR Functionality'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isProcessing 
                ? `Processing ${progress}% complete...`
                : 'Upload a PDF to test if OCR is working correctly'
              }
            </p>
            
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="ocr-test-upload"
            />
            
            <Button
              asChild
              disabled={isProcessing}
              className="gap-2"
            >
              <label htmlFor="ocr-test-upload">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Testing...
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
                <p className="font-medium">OCR Test Failed:</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This indicates that OCR is not working properly. The PDF parser will skip OCR and use PDF.js text extraction only.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                OCR Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.text.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Characters</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {(result.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(result.processingTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Time</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Language Used:</h4>
                <p className="text-sm text-muted-foreground">{result.language}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Extracted Text Preview:</h4>
                <div className="max-h-32 overflow-y-auto bg-muted p-3 rounded text-sm font-mono">
                  {result.text.substring(0, 500)}
                  {result.text.length > 500 && '...'}
                </div>
              </div>
              
              <Button onClick={resetTest} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Another File
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default OCRTest;
