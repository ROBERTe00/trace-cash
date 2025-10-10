import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const toastId = toast.loading(`Parsing ${file.name}...`, {
        description: 'AI is analyzing your transactions'
      });

      // Create FormData and send to edge function
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('parse-csv-excel', {
        body: formData,
      });

      toast.dismiss(toastId);

      if (error) {
        console.error('Parse error:', error);
        throw error;
      }

      if (!data || !data.transactions || data.transactions.length === 0) {
        toast.error('No valid transactions found in file', {
          description: data.error || 'Please check the file format'
        });
        setIsProcessing(false);
        return;
      }

      onTransactionsParsed(data as ParseResult);
      
      toast.success(
        `Parsed ${data.stats.valid} transactions successfully!`,
        { 
          description: data.stats.invalid > 0 
            ? `${data.stats.invalid} rows had errors` 
            : 'AI categorization complete'
        }
      );

    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to parse file', {
        description: 'Please check the format and try again'
      });
    } finally {
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
    <Card className="glass-card p-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              CSV / Excel Import
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your bank transactions file for automatic parsing
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            AI Powered
          </Badge>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Smart Features:</strong> Auto-detects columns, AI categorization, and duplicate detection
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
              <p className="text-sm font-medium">Processing...</p>
              <p className="text-xs text-muted-foreground">Parsing and AI categorizing</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-medium">
                  Drop your CSV or Excel file here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse (max 5MB)
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                Select File
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <p className="font-medium">Supported Formats</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">.csv</Badge>
              <Badge variant="secondary" className="text-xs">.xlsx</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Auto-Detection</p>
            <p className="text-muted-foreground text-xs">
              Finds date, description, amount columns automatically
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
