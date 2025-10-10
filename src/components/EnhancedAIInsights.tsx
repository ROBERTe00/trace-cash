import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { Expense, Investment } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Insight {
  title: string;
  description: string;
  type: 'warning' | 'tip' | 'success' | 'info';
  actionable: string;
}

interface EnhancedAIInsightsProps {
  expenses: Expense[];
  investments: Investment[];
}

export const EnhancedAIInsights = ({ expenses, investments }: EnhancedAIInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateInsights = async () => {
    setIsLoading(true);

    try {
      const totalIncome = expenses
        .filter(e => e.type === 'Income')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalExpenses = expenses
        .filter(e => e.type === 'Expense')
        .reduce((sum, e) => sum + e.amount, 0);

      const investmentsByType = investments.reduce((acc, inv) => {
        const value = inv.quantity * inv.currentPrice;
        acc[inv.type] = (acc[inv.type] || 0) + value;
        return acc;
      }, {} as Record<string, number>);

      const financialData = {
        expenses: expenses
          .filter(e => e.type === 'Expense')
          .map(e => ({
            category: e.category,
            amount: e.amount,
            date: e.date,
          })),
        investments: Object.entries(investmentsByType).map(([type, value]) => ({
          type,
          value,
        })),
        summary: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
        },
      };

      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { data: financialData }
      });

      if (error) {
        console.error('Insights generation error:', error);
        throw error;
      }

      setInsights(data.insights || []);
      setLastUpdated(new Date());
      toast.success('AI insights generated!', {
        description: `${data.insights?.length || 0} personalized insights ready`
      });

    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast.error('Failed to generate insights', {
        description: 'Please try again later'
      });
      
      // Fallback insights
      setInsights([
        {
          title: "Start Tracking Your Finances",
          description: "Upload your expenses and investments to get personalized AI-powered insights about your financial health.",
          type: "info",
          actionable: "Add your first transactions in the Expenses or Upload sections"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (expenses.length > 0 || investments.length > 0) {
      generateInsights();
    }
  }, []);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'tip':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getInsightVariant = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return 'destructive';
      case 'success':
        return 'default';
      case 'tip':
      case 'info':
      default:
        return 'default';
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            AI Financial Insights
          </h3>
          {insights.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {insights.length} insights
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Add transactions and investments to get personalized AI insights about your financial health.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Alert
              key={index}
              variant={getInsightVariant(insight.type)}
              className="border-l-4"
            >
              <div className="flex gap-3">
                <div className="mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm">
                    {insight.description}
                  </AlertDescription>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-primary">
                      💡 Action: {insight.actionable}
                    </p>
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Insights are generated using AI based on your recent transactions and investment activity.
          They update automatically as you add new data.
        </p>
      </div>
    </Card>
  );
};
