import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'tip';
  text: string;
  impact: 'high' | 'medium' | 'low';
}

export function useAIInsights(financialData: any) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateInsights = async () => {
      if (!financialData) return;

      setIsLoading(true);
      try {
        // Simple rule-based insights for now
        const newInsights: AIInsight[] = [];

        // Savings rate insight
        if (financialData.savingsRate > 20) {
          newInsights.push({
            type: 'success',
            text: `Ottimo lavoro! Il tuo tasso di risparmio è del ${financialData.savingsRate.toFixed(1)}%, ben sopra la media del 10-15%.`,
            impact: 'high'
          });
        } else if (financialData.savingsRate < 10 && financialData.savingsRate > 0) {
          newInsights.push({
            type: 'warning',
            text: `Il tuo tasso di risparmio è del ${financialData.savingsRate.toFixed(1)}%. Consigliamo di risparmiare almeno il 15% del reddito.`,
            impact: 'medium'
          });
        }

        // Expenses trend insight
        if (financialData.expensesChange > 10) {
          newInsights.push({
            type: 'warning',
            text: `Le tue spese sono aumentate del ${financialData.expensesChange.toFixed(1)}% rispetto al mese scorso. Considera di rivedere le categorie principali.`,
            impact: 'high'
          });
        } else if (financialData.expensesChange < -5) {
          newInsights.push({
            type: 'success',
            text: `Ottimo miglioramento! Hai ridotto le spese del ${Math.abs(financialData.expensesChange).toFixed(1)}% rispetto al mese scorso.`,
            impact: 'medium'
          });
        }

        // Category insights
        const categories = Object.entries(financialData.categoryBreakdown || {});
        if (categories.length > 0) {
          const [topCategory, topAmount] = categories[0];
          const totalExpenses = financialData.totalExpenses;
          const categoryPercentage = totalExpenses > 0 ? (topAmount as number / totalExpenses) * 100 : 0;

          if (categoryPercentage > 40) {
            newInsights.push({
              type: 'info',
              text: `La categoria "${topCategory}" rappresenta il ${categoryPercentage.toFixed(1)}% delle tue spese. Considera di diversificare meglio il budget.`,
              impact: 'medium'
            });
          }
        }

        // Investment recommendation
        if (financialData.savings > 0 && financialData.savings < 1000) {
          newInsights.push({
            type: 'tip',
            text: `Hai ${financialData.savings.toFixed(0)}€ disponibili. Consigliamo di creare un fondo di emergenza di almeno 3 mesi di spese prima di investire.`,
            impact: 'low'
          });
        }

        setInsights(newInsights);
      } catch (error) {
        console.error('Error generating insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateInsights();
  }, [financialData]);

  return { insights, isLoading };
}

