import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Wallet, Coins, CreditCard, ArrowUpCircle, Info } from "lucide-react";

interface EssentialsStepProps {
  data: any;
  setData: (data: any) => void;
}

export function EssentialsStep({ data, setData }: EssentialsStepProps) {
  const netWorth = data.liquidity + data.assets - data.debts;
  const debtToAssetRatio = data.assets > 0 ? ((data.debts / data.assets) * 100).toFixed(1) : "0";

  const fields = [
    {
      icon: ArrowUpCircle,
      label: "Monthly Income",
      key: "monthlyIncome",
      color: "text-success",
      bgColor: "bg-success/10",
      required: true,
    },
    {
      icon: Wallet,
      label: "Liquidity (Cash Available)",
      key: "liquidity",
      color: "text-info",
      bgColor: "bg-info/10",
      required: false,
    },
    {
      icon: Coins,
      label: "Total Assets",
      key: "assets",
      color: "text-warning",
      bgColor: "bg-warning/10",
      required: false,
    },
    {
      icon: CreditCard,
      label: "Total Debts",
      key: "debts",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      required: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {fields.map((field, idx) => {
          const Icon = field.icon;
          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Label htmlFor={field.key} className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${field.bgColor}`}>
                  <Icon className={`w-4 h-4 ${field.color}`} />
                </div>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={field.key}
                type="number"
                value={data[field.key]}
                onChange={(e) => setData({ ...data, [field.key]: parseInt(e.target.value) || 0 })}
                className="text-lg font-semibold"
                placeholder="0"
              />
            </motion.div>
          );
        })}
      </div>

      {/* AI Insights */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-sm">AI Financial Analysis</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                • <span className="font-semibold text-foreground">Estimated Net Worth:</span>{" "}
                <span className={netWorth >= 0 ? "text-success" : "text-destructive"}>
                  €{netWorth.toLocaleString()}
                </span>
              </p>
              <p>
                • <span className="font-semibold text-foreground">Debt-to-Asset Ratio:</span>{" "}
                <span className={parseFloat(debtToAssetRatio) < 30 ? "text-success" : "text-warning"}>
                  {debtToAssetRatio}%
                </span>{" "}
                {parseFloat(debtToAssetRatio) < 30 ? "(Healthy)" : "(Consider reducing debt)"}
              </p>
              <p>
                • <span className="font-semibold text-foreground">Liquidity Coverage:</span>{" "}
                {data.monthlyIncome > 0
                  ? `${(data.liquidity / data.monthlyIncome).toFixed(1)} months`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
