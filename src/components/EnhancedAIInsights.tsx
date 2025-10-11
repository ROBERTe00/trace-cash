import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Loader2,
  RefreshCw,
  Lightbulb,
  Target,
  ArrowRight
} from "lucide-react";
import { Expense, Investment } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

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
  const { t } = useApp();
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
  }, [expenses, investments]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'tip':
        return Lightbulb;
      case 'success':
        return CheckCircle2;
      case 'info':
      default:
        return Info;
    }
  };

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return {
          card: 'border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:shadow-lg',
          icon: 'bg-amber-500/20 text-amber-600',
          badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
        };
      case 'success':
        return {
          card: 'border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:shadow-lg',
          icon: 'bg-green-500/20 text-green-600',
          badge: 'bg-green-500/20 text-green-700 dark:text-green-300'
        };
      case 'tip':
        return {
          card: 'border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-lg',
          icon: 'bg-blue-500/20 text-blue-600',
          badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
        };
      case 'info':
      default:
        return {
          card: 'border-l-4 border-l-primary bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg',
          icon: 'bg-primary/20 text-primary',
          badge: 'bg-primary/20 text-primary'
        };
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('ai.financialInsights')}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {insights.length > 0 
                  ? `${insights.length} ${t('ai.insightsAvailable')}`
                  : t('ai.noInsights')}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                {t('ai.updated')} {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('ai.analyzing')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t('ai.refresh')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted/50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Info className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold mb-2">{t('ai.noInsightsTitle')}</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('ai.noInsightsDesc')}
            </p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              const styles = getInsightStyles(insight.type);
              
              return (
                <AccordionItem 
                  key={index} 
                  value={`insight-${index}`}
                  className={`border rounded-xl overflow-hidden ${styles.card}`}
                >
                  <AccordionTrigger className="hover:no-underline px-6 py-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className={`p-2.5 rounded-lg ${styles.icon} shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-base">{insight.title}</h4>
                      </div>
                      <Badge variant="outline" className={`${styles.badge} shrink-0 text-xs`}>
                        {t(`ai.type${insight.type.charAt(0).toUpperCase()}${insight.type.slice(1)}`)}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium mb-1">
                              {t('ai.actionSteps')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {insight.actionable}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <p>{t('ai.poweredBy')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
