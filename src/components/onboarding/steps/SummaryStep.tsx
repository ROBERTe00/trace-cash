import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, PiggyBank, Wallet, Target, ArrowUpCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SummaryStepProps {
  data: any;
}

export function SummaryStep({ data }: SummaryStepProps) {
  const [aiProjections, setAiProjections] = useState<any>(null);
  const [loadingProjections, setLoadingProjections] = useState(false);
  
  const netWorth = data.liquidity + data.assets - data.debts;
  const savingsRate = data.monthlyIncome > 0 
    ? ((data.savingsGoal / data.monthlyIncome) * 100).toFixed(0) 
    : "0";

  useEffect(() => {
    const fetchProjections = async () => {
      setLoadingProjections(true);
      try {
        const { data: insightData, error } = await supabase.functions.invoke('onboarding-ai-insights', {
          body: { data, step: 'summary' }
        });
        
        if (error) throw error;
        if (insightData?.insight) {
          setAiProjections(insightData.insight);
        }
      } catch (error) {
        console.error('Error fetching AI projections:', error);
      } finally {
        setLoadingProjections(false);
      }
    };

    fetchProjections();
  }, []);

  const stats = [
    {
      icon: ArrowUpCircle,
      label: "Monthly Income",
      value: `€${data.monthlyIncome.toLocaleString()}`,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Target,
      label: "Savings Goal",
      value: `€${data.savingsGoal.toLocaleString()}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Wallet,
      label: "Net Worth",
      value: `€${netWorth.toLocaleString()}`,
      color: netWorth >= 0 ? "text-success" : "text-destructive",
      bgColor: netWorth >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
    {
      icon: PiggyBank,
      label: "Savings Rate",
      value: `${savingsRate}%`,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Your Financial Profile is Ready</span>
        </div>
        <p className="text-muted-foreground">Here's your personalized overview</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color} truncate-text`}>{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* AI Projections */}
      <Card className="p-4 bg-gradient-to-br from-success/10 to-info/10 border-success/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <p className="font-medium text-sm">AI Financial Projections</p>
          </div>
          
          {loadingProjections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Calculating projections...</span>
            </div>
          ) : aiProjections ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">1 Year Projection</p>
                <p className="text-lg font-bold text-success">
                  {aiProjections.oneYear || `€${(data.savingsGoal * 12).toLocaleString()}`}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">3 Year Projection</p>
                <p className="text-lg font-bold text-success">
                  {aiProjections.threeYear || `€${(netWorth + data.savingsGoal * 36 * 1.05).toLocaleString()}`}
                </p>
              </div>

              {aiProjections.tip && (
                <div className="col-span-2 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>AI Tip:</strong> {aiProjections.tip}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>🎉 Your personalized dashboard is ready!</p>
        <p className="mt-1">Complete setup to begin tracking your finances with AI insights.</p>
      </div>
    </div>
  );
}
