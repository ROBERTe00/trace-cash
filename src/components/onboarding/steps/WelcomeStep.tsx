import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";

interface WelcomeStepProps {
  data: any;
  setData: (data: any) => void;
}

export function WelcomeStep({ data, setData }: WelcomeStepProps) {
  const monthsToGoal = data.monthlyIncome > 0 ? Math.ceil(data.savingsGoal / (data.monthlyIncome * 0.2)) : 0;

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

      <div className="space-y-4">
        <div className="text-center">
          <span className="metric-text text-4xl">€{data.savingsGoal.toLocaleString()}</span>
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

      {monthsToGoal > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">AI Insight</p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on a 20% savings rate, you could reach your €{data.savingsGoal.toLocaleString()} goal 
                in approximately <span className="font-semibold text-primary">{monthsToGoal} months</span>.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
