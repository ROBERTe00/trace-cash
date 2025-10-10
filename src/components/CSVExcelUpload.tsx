import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Upload, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parseCSV, parseExcel, ParseResult } from "@/lib/csvParser";
import { Expense } from "@/lib/storage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CSVExcelUploadProps {
  existingExpenses: Expense[];
  onTransactionsParsed: (result: ParseResult) => void;
}

export const CSVExcelUpload = ({ existingExpenses, onTransactionsParsed }: CSVExcelUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
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
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
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

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const toastId = toast.loading(`Parsing ${file.name}...`);

      let result: ParseResult;
      
      if (file.name.endsWith('.csv')) {
        result = await parseCSV(file, existingExpenses);
      } else {
        result = await parseExcel(file, existingExpenses);
      }

      toast.dismiss(toastId);

      if (result.transactions.length === 0) {
        toast.error('No valid transactions found in file');
        setIsProcessing(false);
        setFileName(null);
        return;
      }

      onTransactionsParsed(result);
      
      toast.success(
        `Parsed ${result.stats.valid} transactions successfully!`,
        { description: result.stats.duplicates > 0 ? `${result.stats.duplicates} duplicates detected` : undefined }
      );

    } catch (error) {
      console.error('File parsing error:', error);
      toast.error('Failed to parse file. Please check the format and try again.');
    } finally {
      setIsProcessing(false);
      setFileName(null);
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
            Smart Parser
          </Badge>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Privacy First:</strong> Files are processed locally in your browser. 
            No data is sent to servers during parsing.
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
            accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />

          {isProcessing ? (
            <div className="space-y-2">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
              <p className="text-sm font-medium">Processing {fileName}...</p>
              <p className="text-xs text-muted-foreground">Parsing and validating data</p>
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
            <Label className="text-xs font-medium">Supported Formats</Label>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">.csv</Badge>
              <Badge variant="secondary" className="text-xs">.xls</Badge>
              <Badge variant="secondary" className="text-xs">.xlsx</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Auto-Detection</Label>
            <p className="text-muted-foreground">
              Automatically finds date, description, and amount columns
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
