import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Plus, TrendingUp, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InvestmentsStepProps {
  data: any;
  setData: (data: any) => void;
}

export function InvestmentsStep({ data, setData }: InvestmentsStepProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // In production, this would call GPT-4o to fetch live prices
    }
  };

  const samplePortfolio = [
    { name: "Apple Inc. (AAPL)", value: 15000, yield: "+12.3%", color: "text-success" },
    { name: "Tesla (TSLA)", value: 8500, yield: "-3.2%", color: "text-destructive" },
    { name: "S&P 500 ETF", value: 12000, yield: "+8.7%", color: "text-success" },
  ];

  const totalValue = samplePortfolio.reduce((sum, item) => sum + item.value, 0);
  const avgYield = ((12.3 - 3.2 + 8.7) / 3).toFixed(1);

  return (
    <div className="space-y-6">
      <Alert className="bg-success/10 border-success/20">
        <Activity className="w-4 h-4 text-success" />
        <AlertDescription>
          <strong>Optional:</strong> Import your investments and AI will fetch live prices and calculate performance using GPT-4o. You can add investments later from the dashboard.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <label htmlFor="investment-upload">
            <Card className="p-6 cursor-pointer hover:border-primary transition-colors">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-success/10">
                  <Upload className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="font-medium">Import Excel</p>
                  <p className="text-sm text-muted-foreground">Upload portfolio data</p>
                </div>
              </div>
            </Card>
          </label>
          <input
            id="investment-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-6 cursor-pointer hover:border-primary transition-colors h-full">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-secondary/10">
                <Plus className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-medium">Add Manually</p>
                <p className="text-sm text-muted-foreground">Enter investments</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sample Portfolio Preview */}
      <Card className="p-4 bg-gradient-to-br from-success/5 to-info/5 border-success/20">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <p className="font-medium text-sm">AI Portfolio Analysis (Sample Data)</p>
          </div>

          <div className="space-y-2">
            {samplePortfolio.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground truncate-text max-w-[150px]">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">€{item.value.toLocaleString()}</span>
                  <span className={`text-xs font-medium ${item.color}`}>{item.yield}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-medium">Portfolio Yield</span>
            </div>
            <span className="text-lg font-bold text-success">+{avgYield}%</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Total Portfolio Value: €{totalValue.toLocaleString()}
          </p>
        </div>
      </Card>

    </div>
  );
}
