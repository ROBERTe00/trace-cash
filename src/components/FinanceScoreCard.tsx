import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AIInsightModal } from "@/components/AIInsightModal";

interface FinanceScoreCardProps {
  score: number;
}

const getScoreLabel = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: "Excellent", color: "text-success" };
  if (score >= 60) return { label: "Good", color: "text-info" };
  if (score >= 40) return { label: "Fair", color: "text-warning" };
  return { label: "Poor", color: "text-destructive" };
};

const FinanceScoreCard = ({ score }: FinanceScoreCardProps) => {
  const { label, color } = getScoreLabel(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-muted-foreground">Finance Score</CardTitle>
              <AIInsightModal
                title="Finance Health Score"
                metric="Your overall financial health rating"
                value={`${score}%`}
                explanation="The Finance Health Score measures your overall financial wellness based on multiple factors including income stability, savings rate, investment diversification, and goal achievement."
                calculation="Score = (Income-Expense Ratio × 25) + (Has Investments × 15) + (Has Goals × 10) + Base(50)"
                suggestions={[
                  `Your score is ${label.toLowerCase()}. ${score < 50 ? 'Focus on reducing expenses and building an emergency fund.' : score < 75 ? 'Great progress! Consider increasing your investment allocation.' : 'Excellent! Keep maintaining your healthy financial habits.'}`,
                  "Track all expenses to identify saving opportunities",
                  "Set up automatic transfers to savings accounts",
                  "Diversify investments across different asset classes",
                  "Review and adjust financial goals quarterly"
                ]}
                improvement={score < 75 ? "Increasing your savings rate by just 5% can significantly improve your score over time." : "Maintain your current habits and consider consulting a financial advisor for advanced optimization."}
              />
            </div>
            <TrendingUp className="icon-card text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <motion.span
              className="text-medium-number"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              {score}%
            </motion.span>
            <span className={`text-sm font-semibold ${color}`}>{label}</span>
          </div>
          
          <div className="relative">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>

          {/* Decorative Trend Graph */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            <svg width="100%" height="60" className="overflow-visible">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 0 40 Q 25 20, 50 30 T 100 15 T 150 25 T 200 10 T 250 20 T 300 5"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.6 }}
              />
              <motion.path
                d="M 0 40 Q 25 20, 50 30 T 100 15 T 150 25 T 200 10 T 250 20 T 300 5 L 300 60 L 0 60 Z"
                fill="url(#scoreGradient)"
                opacity="0.2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.2 }}
                transition={{ duration: 1.5, delay: 0.7 }}
              />
            </svg>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FinanceScoreCard;
