import { useUpload } from "@/contexts/UploadContext";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Loader2 } from "lucide-react";

export const UploadProgressBar = () => {
  const { isProcessing, progress, fileName } = useUpload();

  if (!isProcessing) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 animate-slide-up">
      <Card className="glass-card border-2 border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium truncate pr-2">
                Processing {fileName}
              </p>
              <span className="text-xs font-medium text-primary flex-shrink-0">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Extracting transactions with AI...</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};