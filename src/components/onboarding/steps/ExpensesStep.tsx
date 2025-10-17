import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Plus, TrendingDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ManualExpenseDialog } from "../ManualExpenseDialog";
import { toast } from "sonner";

interface ExpensesStepProps {
  data: any;
  setData: (data: any) => void;
}

export function ExpensesStep({ data, setData }: ExpensesStepProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success(`${file.name} uploaded! You can upload it from the dashboard after completing onboarding.`);
    }
  };

  const sampleCategories = [
    { name: "Food & Dining", amount: 450, percentage: 30 },
    { name: "Housing", amount: 800, percentage: 53 },
    { name: "Transport", amount: 150, percentage: 10 },
    { name: "Entertainment", amount: 100, percentage: 7 },
  ];

  return (
    <div className="space-y-6">
      <Alert className="bg-info/10 border-info/20">
        <TrendingDown className="w-4 h-4 text-info" />
        <AlertDescription>
          <strong>Optional:</strong> Upload your bank statement (PDF/CSV) and AI will automatically categorize your expenses. You can add expenses later from the dashboard.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <label htmlFor="file-upload">
            <Card className="p-6 cursor-pointer hover:border-primary transition-colors">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Upload PDF/CSV</p>
                  <p className="text-sm text-muted-foreground">Bank statements</p>
                </div>
                {uploadedFile && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <FileText className="w-4 h-4" />
                    {uploadedFile.name}
                  </div>
                )}
              </div>
            </Card>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.csv,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card 
            className="p-6 cursor-pointer hover:border-primary transition-colors h-full"
            onClick={() => setIsManualDialogOpen(true)}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-secondary/10">
                <Plus className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-medium">Add Manually</p>
                <p className="text-sm text-muted-foreground">Enter expenses yourself</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sample AI Categorization */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="font-medium text-sm">AI Categorization Preview (Sample Data)</p>
          </div>
          
          <div className="space-y-2">
            {sampleCategories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{category.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">€{category.amount}</span>
                  <span className="text-xs text-muted-foreground">({category.percentage}%)</span>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Top 3 categories: Food (30%), Housing (53%), Transport (10%)
          </p>
        </div>
      </Card>

      <ManualExpenseDialog 
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onExpenseAdded={() => {
          toast.success("Expense added! You can add more or continue.");
        }}
      />
    </div>
  );
}
