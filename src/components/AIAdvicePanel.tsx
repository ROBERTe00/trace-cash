import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, RefreshCw, Lightbulb, TrendingDown, Target, PieChart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Expense, Investment, FinancialGoal } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";

interface AIAdvicePanelProps {
  expenses: Expense[];
  investments: Investment[];
  goals: FinancialGoal[];
}

interface Advice {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  icon?: any;
}

export function AIAdvicePanel({ expenses, investments, goals }: AIAdvicePanelProps) {
  const { toast } = useToast();
  const { t, formatCurrency } = useApp();
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState<Advice | null>(null);

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
          icon: i === 0 ? Target : i === 1 ? TrendingDown : PieChart,
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
        title: t("ai.goalBehindSchedule"),
        description: `${t("ai.youAreBehind")} "${goal.name}". ${t("ai.increaseSavings")} ${formatCurrency(remaining / 30)}/day ${t("ai.toStayOnTrack")}.`,
        impact: "high",
        icon: Target,
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
        title: t("ai.reduceTopCategory"),
        description: `${topCategory[0]} ${t("ai.accountsFor")} ${formatCurrency(topCategory[1])}. ${t("ai.considerCutting")} 15% ${t("ai.toAccelerateGoals")}.`,
        impact: "medium",
        icon: TrendingDown,
      });
    }

    // Investment diversification
    const portfolioValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
    if (investments.length < 3 && portfolioValue > 1000) {
      advices.push({
        title: t("ai.diversifyPortfolio"),
        description: t("ai.diversifyPortfolioDesc"),
        impact: "medium",
        icon: PieChart,
      });
    }

    return advices.slice(0, 3);
  };

  useEffect(() => {
    if (expenses.length > 0) {
      fetchAdvice();
    }
  }, []);

  const getImpactStyles = (impact: string) => {
    switch (impact) {
      case "high": 
        return {
          card: "border-l-red-500 bg-gradient-to-br from-red-500/10 to-red-600/5",
          icon: "bg-red-500/20",
          badge: "bg-red-500/20 text-red-700 dark:text-red-300"
        };
      case "medium": 
        return {
          card: "border-l-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/5",
          icon: "bg-amber-500/20",
          badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300"
        };
      case "low": 
        return {
          card: "border-l-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/5",
          icon: "bg-blue-500/20",
          badge: "bg-blue-500/20 text-blue-700 dark:text-blue-300"
        };
      default: 
        return {
          card: "border-l-gray-500 bg-gradient-to-br from-gray-500/10 to-gray-600/5",
          icon: "bg-gray-500/20",
          badge: "bg-gray-500/20 text-gray-700 dark:text-gray-300"
        };
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
          <h2 className="text-2xl font-bold">{t("ai.insights")}</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchAdvice}
          disabled={loading}
          className="gap-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t("ai.refresh")}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-[220px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : advices.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2 font-medium">{t("ai.noInsights")}</p>
          <p className="text-sm text-muted-foreground">{t("ai.addMore")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {advices.map((advice, index) => {
            const Icon = advice.icon || Lightbulb;
            const styles = getImpactStyles(advice.impact);
            
            return (
              <Card
                key={index}
                className={`p-6 border-l-4 ${styles.card} hover-lift transition-all duration-300 hover:scale-[1.02] min-h-[220px] shadow-lg hover:shadow-xl`}
              >
                <div className="flex items-start gap-4 h-full">
                  <div className={`p-3 rounded-full shadow-md ${styles.icon} shrink-0`}>
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-3 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg line-clamp-1 flex-1">{advice.title}</h3>
                      <Badge variant="outline" className={`shrink-0 shadow-sm ${styles.badge}`}>
                        {t(`ai.${advice.impact}Impact`)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {advice.description}
                    </p>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAdvice(advice)}
                      className="mt-auto w-full gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {t('ai.learnMore')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        💡 {t("ai.powered")}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAdvice} onOpenChange={() => setSelectedAdvice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAdvice?.icon && <selectedAdvice.icon className="h-6 w-6 text-primary" />}
              {selectedAdvice?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Badge className={getImpactStyles(selectedAdvice?.impact || "low").badge}>
                {t(`ai.${selectedAdvice?.impact}Impact`)}
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {selectedAdvice?.description}
            </p>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-2">{t("ai.actionSteps")}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t("ai.reviewYourData")}</li>
                <li>{t("ai.setSmartGoals")}</li>
                <li>{t("ai.trackProgress")}</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}