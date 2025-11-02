import { useState, useCallback } from 'react';
import { coreAIEngine, type AIRequestType, type AIResponse, type AIRequestContext } from '@/ai/core-ai-engine';
import { useExpenses } from './useExpenses';
import { useInvestments } from './useInvestments';
import { useFinancialGoals } from './useFinancialGoals';

/**
 * Hook per utilizzare il CoreAIEngine in modo semplificato
 */
export function useCoreAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { expenses } = useExpenses();
  const { investments } = useInvestments();
  const { goals } = useFinancialGoals();

  const processRequest = useCallback(async <T = any>(
    type: AIRequestType,
    data: any = {},
    options: {
      autoFetchUserData?: boolean;
      context?: Partial<AIRequestContext>;
    } = {}
  ): Promise<AIResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      // Ottieni context utente se richiesto
      let context: AIRequestContext = options.context || {};
      if (options.autoFetchUserData !== false) {
        const userContext = await coreAIEngine.getUserContext();
        context = { ...userContext, ...context };
      }

      // Auto-merge dati utente se richiesto
      let requestData = { ...data };
      if (options.autoFetchUserData !== false) {
        if (type === 'insight_generation' || type === 'data_analysis' || type === 'report_generation') {
          requestData = {
            ...requestData,
            expenses: requestData.expenses || expenses,
            investments: requestData.investments || investments,
            goals: requestData.goals || goals
          };
        }
      }

      const result = await coreAIEngine.processRequest(type, requestData, context);
      
      if (!result.success) {
        setError(result.error || 'Unknown error');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [expenses, investments, goals]);

  // Helper methods per tipi di richiesta comuni
  const generateInsights = useCallback(async (scope: 'dashboard' | 'detailed' = 'dashboard') => {
    return processRequest('insight_generation', { scope }, { autoFetchUserData: true });
  }, [processRequest]);

  const generateChart = useCallback(async (chartData: {
    type: string;
    timeframe: string;
    symbols?: string[];
    dataSource?: string;
    prompt?: string;
  }) => {
    return processRequest('chart_generation', chartData, { autoFetchUserData: true });
  }, [processRequest]);

  const generateLesson = useCallback(async (topic?: string, level?: 'beginner' | 'intermediate' | 'advanced') => {
    return processRequest('educational_content', { topic, level }, { autoFetchUserData: false });
  }, [processRequest]);

  const analyzeData = useCallback(async (timeframe?: string) => {
    return processRequest('data_analysis', { timeframe }, { autoFetchUserData: true });
  }, [processRequest]);

  const generateReport = useCallback(async (
    type: 'monthly' | 'quarterly' | 'annual' | 'custom',
    format: 'pdf' | 'csv' = 'pdf'
  ) => {
    return processRequest('report_generation', { type, format }, { autoFetchUserData: true });
  }, [processRequest]);

  const processDocument = useCallback(async (
    fileContent: string,
    fileType: 'pdf' | 'csv' | 'excel',
    options: {
      enableAnomalyDetection?: boolean;
      enableInsights?: boolean;
      enableSummarization?: boolean;
      customCategories?: string[];
    } = {}
  ) => {
    return processRequest(
      'document_processing',
      {
        fileContent,
        fileType,
        ...options
      },
      { autoFetchUserData: true }
    );
  }, [processRequest]);

  const detectAnomalies = useCallback(async (transactions: any[]) => {
    return processRequest('anomaly_detection', { transactions }, { autoFetchUserData: false });
  }, [processRequest]);

  return {
    processRequest,
    generateInsights,
    generateChart,
    generateLesson,
    analyzeData,
    generateReport,
    processDocument,
    detectAnomalies,
    loading,
    error,
    clearError: () => setError(null)
  };
}

