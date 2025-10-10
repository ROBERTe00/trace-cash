import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, AlertCircle, Target, Sparkles } from "lucide-react";
import { Expense } from "@/lib/storage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExpenseInsightsProps {
  expenses: Expense[];
}

interface Insight {
  type: "tip" | "warning" | "achievement";
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ExpenseInsights({ expenses }: ExpenseInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear &&
           e.type === "Expense";
  });

  useEffect(() => {
    generateInsights();
  }, [expenses]);

  const generateInsights = async () => {
    const staticInsights: Insight[] = [];

    // Analisi categorie
    const categoryTotals = currentMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalCurrent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Alert per categorie over budget
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      const percentage = (amount / totalCurrent) * 100;
      if (percentage > 30) {
        staticInsights.push({
          type: "warning",
          title: `${category}: Alto utilizzo`,
          description: `Stai spendendo il ${percentage.toFixed(0)}% del tuo budget in ${category}. Considera di ridurre €${(amount * 0.1).toFixed(2)} per bilanciare il budget.`,
          icon: <AlertCircle className="h-5 w-5 text-orange-500" />
        });
      }
    });

    // Confronto con mese precedente
    const previousMonthExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === prevMonth && 
             date.getFullYear() === prevYear &&
             e.type === "Expense";
    });

    const totalPrevious = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    if (totalCurrent < totalPrevious) {
      const saved = totalPrevious - totalCurrent;
      staticInsights.push({
        type: "achievement",
        title: "Ottimo lavoro! 🎉",
        description: `Hai risparmiato €${saved.toFixed(2)} rispetto al mese scorso. Continua così!`,
        icon: <Target className="h-5 w-5 text-green-500" />
      });
    } else if (totalCurrent > totalPrevious) {
      const increase = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
      staticInsights.push({
        type: "tip",
        title: "Spese in aumento",
        description: `Le tue spese sono aumentate del ${increase.toFixed(0)}% rispetto al mese scorso. Prova a impostare un budget più rigido per le categorie con maggiore aumento.`,
        icon: <TrendingUp className="h-5 w-5 text-blue-500" />
      });
    }

    // Suggerimento generico
    if (staticInsights.length === 0) {
      staticInsights.push({
        type: "tip",
        title: "Monitora regolarmente",
        description: "Continua a registrare le tue spese per ottenere insight più accurati e personalizzati.",
        icon: <Lightbulb className="h-5 w-5 text-yellow-500" />
      });
    }

    setInsights(staticInsights);
  };

  const generateAIInsights = async () => {
    setLoading(true);
    try {
      const expensesSummary = currentMonthExpenses.map(e => ({
        category: e.category,
        amount: e.amount,
        description: e.description
      }));

      const { data, error } = await supabase.functions.invoke('ai-financial-advice', {
        body: { 
          type: 'expense_insights',
          data: expensesSummary 
        }
      });

      if (error) throw error;

      if (data?.insights) {
        toast.success("Insight AI generati!");
        // Aggiungi insight AI a quelli esistenti
        const aiInsights: Insight[] = data.insights.slice(0, 2).map((insight: string) => ({
          type: "tip" as const,
          title: "Suggerimento AI",
          description: insight,
          icon: <Sparkles className="h-5 w-5 text-purple-500" />
        }));
        setInsights([...aiInsights, ...insights]);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast.error("Errore nella generazione degli insight AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insight Proattivi
              </CardTitle>
              <CardDescription>
                Suggerimenti personalizzati per migliorare le tue finanze
              </CardDescription>
            </div>
            <Button 
              onClick={generateAIInsights} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Generando..." : "AI Insights"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length === 0 ? (
            <Alert>
              <AlertDescription>
                Aggiungi più transazioni per ricevere insight personalizzati.
              </AlertDescription>
            </Alert>
          ) : (
            insights.map((insight, index) => (
              <Alert 
                key={index}
                variant={insight.type === "warning" ? "destructive" : "default"}
                className={
                  insight.type === "achievement" 
                    ? "border-green-500/50 bg-green-500/10" 
                    : insight.type === "tip"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : ""
                }
              >
                <div className="flex gap-3">
                  {insight.icon}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <AlertDescription>{insight.description}</AlertDescription>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
