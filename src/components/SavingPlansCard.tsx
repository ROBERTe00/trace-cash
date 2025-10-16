import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface SavingPlan {
  name: string;
  current: number;
  target: number;
  color: string;
}

interface SavingPlansCardProps {
  plans: SavingPlan[];
  onAddPlan?: () => void;
}

const SavingPlansCard = ({ plans, onAddPlan }: SavingPlansCardProps) => {
  const { formatCurrency } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Saving Plans</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onAddPlan}
              className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.map((plan, index) => {
            const percentage = ((plan.current / plan.target) * 100).toFixed(0);
            return (
              <motion.div
                key={plan.name}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{plan.name}</span>
                  <span className="text-xs text-muted-foreground font-semibold">{percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(plan.current)}</span>
                  <span>/ {formatCurrency(plan.target)}</span>
                </div>
                <div className="relative">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: plan.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.7 + index * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SavingPlansCard;
