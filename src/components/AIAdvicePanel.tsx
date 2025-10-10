import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Expense, Investment, FinancialGoal } from "@/lib/storage";

interface AIAdvicePanelProps {
  expenses: Expense[];
  investments: Investment[];
  goals: FinancialGoal[];
}

interface Advice {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export function AIAdvicePanel({ expenses, investments, goals }: AIAdvicePanelProps) {
  const { toast } = useToast();
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const totalExpenses = expenses
        .filter(e => e.type === "Expense")
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalIncome = expenses
        .filter(e => e.type === "Income")
        .reduce((sum, e) => sum + e.amount, 0);
      
      const portfolioValue = investments.reduce(
        (sum, inv) => sum + inv.quantity * inv.currentPrice,
        0
      );

      const categoryBreakdown = expenses
        .filter(e => e.type === "Expense")
        .reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {} as { [key: string]: number });

      const goalsProgress = goals.map(g => ({
        name: g.name,
        progress: (g.currentAmount / g.targetAmount) * 100,
        remaining: g.targetAmount - g.currentAmount,
      }));

      const { data, error } = await supabase.functions.invoke('ai-financial-advice', {
        body: {
          financialData: {
            totalExpenses,
            totalIncome,
            portfolioValue,
            categoryBreakdown,
            expenseCount: expenses.length,
            investmentCount: investments.length,
            goalsProgress,
          }
        }
      });

      if (error) throw error;

      if (data?.advice) {
        const parsedAdvices = parseAIAdvice(data.advice);
        setAdvices(parsedAdvices);
      }
    } catch (error: any) {
      console.error('Error fetching AI advice:', error);
      setAdvices(getFallbackAdvice(expenses, investments, goals));
    } finally {
      setLoading(false);
    }
  };

  const parseAIAdvice = (aiResponse: string): Advice[] => {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const advices: Advice[] = [];
    
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].replace(/^\d+\.\s*/, '').replace(/^-\s*/, '');
      if (line.length > 10) {
        advices.push({
          title: line.substring(0, 50),
          description: line,
          impact: i === 0 ? "high" : i === 1 ? "medium" : "low",
        });
      }
    }
    
    return advices.length > 0 ? advices : getFallbackAdvice(expenses, investments, goals);
  };

  const getFallbackAdvice = (expenses: Expense[], investments: Investment[], goals: FinancialGoal[]): Advice[] => {
    const advices: Advice[] = [];
    
    // Check goals progress
    const behindGoals = goals.filter(g => {
      const daysLeft = Math.ceil((new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const progress = (g.currentAmount / g.targetAmount) * 100;
      const expectedProgress = daysLeft > 0 ? 100 - (daysLeft / 365) * 100 : 100;
      return progress < expectedProgress - 10;
    });

    if (behindGoals.length > 0) {
      const goal = behindGoals[0];
      const remaining = goal.targetAmount - goal.currentAmount;
      advices.push({
        title: "Goal Behind Schedule",
        description: `You're behind on "${goal.name}". Increase savings by €${(remaining / 30).toFixed(2)}/day to stay on track.`,
        impact: "high",
      });
    }

    // Analyze spending patterns
    const categoryTotals = expenses
      .filter(e => e.type === "Expense")
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as { [key: string]: number });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory && topCategory[1] > 500) {
      advices.push({
        title: "Reduce Top Spending Category",
        description: `${topCategory[0]} accounts for €${topCategory[1].toFixed(2)}. Consider cutting 15% to accelerate your goals.`,
        impact: "medium",
      });
    }

    // Investment diversification
    const portfolioValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
    if (investments.length < 3 && portfolioValue > 1000) {
      advices.push({
        title: "Diversify Your Portfolio",
        description: "Consider adding 2-3 more assets to reduce risk. ETFs provide instant diversification.",
        impact: "medium",
      });
    }

    return advices.slice(0, 3);
  };

  useEffect(() => {
    if (expenses.length > 0) {
      fetchAdvice();
    }
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "from-red-500/20 to-red-600/5 border-red-500/30";
      case "medium": return "from-orange-500/20 to-orange-600/5 border-orange-500/30";
      case "low": return "from-blue-500/20 to-blue-600/5 border-blue-500/30";
      default: return "from-gray-500/20 to-gray-600/5 border-gray-500/30";
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Insights</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchAdvice}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : advices.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No insights yet</p>
          <p className="text-sm text-muted-foreground">Add more transactions to get personalized advice</p>
        </div>
      ) : (
        <div className="space-y-3">
          {advices.map((advice, index) => (
            <Card
              key={index}
              className={`p-4 border bg-gradient-to-br ${getImpactColor(advice.impact)} hover-lift transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{advice.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      advice.impact === "high" ? "bg-red-500/20 text-red-700 dark:text-red-300" :
                      advice.impact === "medium" ? "bg-orange-500/20 text-orange-700 dark:text-orange-300" :
                      "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                    }`}>
                      {advice.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{advice.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        💡 Insights powered by AI - recommendations based on your financial patterns
      </div>
    </Card>
  );
}
