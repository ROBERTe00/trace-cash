import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileSpreadsheet, Mail, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PDFParsingHelpProps {
  fileName?: string;
  errorMessage?: string;
  transactionsFound: number;
  expectedTransactions?: number;
}

export const PDFParsingHelp = ({
  fileName,
  errorMessage,
  transactionsFound,
  expectedTransactions,
}: PDFParsingHelpProps) => {
  const navigate = useNavigate();
  const isPartialExtraction = expectedTransactions && transactionsFound < expectedTransactions;

  return (
    <Card className="border-2 border-yellow-500/30 bg-yellow-500/5 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            {isPartialExtraction
              ? `Only ${transactionsFound} of ${expectedTransactions} transactions extracted`
              : "PDF Processing Issue"}
          </h3>
          
          {errorMessage && (
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
          )}

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Why did this happen?</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>The PDF may be scanned/image-based (requires OCR)</li>
                <li>Complex table formatting that's hard to parse</li>
                <li>Multi-page statement with inconsistent formatting</li>
                <li>Protected or encrypted PDF</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">What can you do?</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/upload?tab=csv')}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Upload CSV Instead
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open('mailto:support@tracecash.app?subject=PDF Parsing Issue&body=' + 
                      encodeURIComponent(`File: ${fileName}\nError: ${errorMessage}\nTransactions found: ${transactionsFound}`), 
                      '_blank'
                    );
                  }}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Report Issue
                </Button>
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Tips for better results:</p>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Export your statement as CSV from your bank's website</li>
                    <li>Ensure PDF is not password-protected</li>
                    <li>Try a different date range (fewer transactions)</li>
                    <li>Check if your bank is supported</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
