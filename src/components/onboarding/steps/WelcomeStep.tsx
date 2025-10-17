import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeStepProps {
  data: any;
  setData: (data: any) => void;
}

export function WelcomeStep({ data, setData }: WelcomeStepProps) {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Initialize monthlyIncome if not set
  useEffect(() => {
    if (data.monthlyIncome === 0 || !data.monthlyIncome) {
      setData({ ...data, monthlyIncome: 1000, savingsGoal: 500 });
    }
  }, []);

  useEffect(() => {
    const fetchAiInsight = async () => {
      if (data.savingsGoal >= 500 && data.monthlyIncome >= 500) {
        setLoadingInsight(true);
        try {
          const { data: insightData, error } = await supabase.functions.invoke('onboarding-ai-insights', {
            body: { data, step: 'welcome' }
          });
          
          if (error) throw error;
          if (insightData?.insight) {
            setAiInsight(insightData.insight);
          }
        } catch (error) {
          console.error('Error fetching AI insight:', error);
        } finally {
          setLoadingInsight(false);
        }
      }
    };

    const debounce = setTimeout(fetchAiInsight, 1000);
    return () => clearTimeout(debounce);
  }, [data.savingsGoal, data.monthlyIncome]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border-2 border-dashed border-primary/30"
          />
        </div>
      </motion.div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">What's your monthly savings goal?</h3>
        <p className="text-muted-foreground">Set a realistic target to track your progress</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Monthly Income</label>
          <div className="text-center">
            <span className="metric-text text-3xl">€{data.monthlyIncome.toLocaleString()}</span>
            <span className="text-muted-foreground ml-2">/month</span>
          </div>
          <Slider
            value={[data.monthlyIncome]}
            onValueChange={([value]) => setData({ ...data, monthlyIncome: value })}
            min={500}
            max={30000}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>€500</span>
            <span>€30,000</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Savings Goal</label>
          <div className="text-center">
            <span className="metric-text text-3xl">€{data.savingsGoal.toLocaleString()}</span>
            <span className="text-muted-foreground ml-2">/month</span>
          </div>
          <Slider
            value={[data.savingsGoal]}
            onValueChange={([value]) => setData({ ...data, savingsGoal: value })}
            min={500}
            max={20000}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>€500</span>
            <span>€20,000</span>
          </div>
        </div>
      </div>

      {(aiInsight || loadingInsight) && (
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              {loadingInsight ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <TrendingUp className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm mb-1">💡 AI Insight (GPT-4o)</p>
              {loadingInsight ? (
                <p className="text-sm text-muted-foreground">Analyzing your goals...</p>
              ) : (
                <p className="text-sm text-muted-foreground">{aiInsight}</p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
