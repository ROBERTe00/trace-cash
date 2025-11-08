// Core AI Engine - Orchestratore centrale per tutte le richieste AI
import { geminiAI } from '@/lib/geminiAI';
import { aiChartGenerator, type ChartRequest, type SmartChartResult } from '@/lib/ai-chart-generator';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToCSV, type ExportData } from '@/lib/exportUtils';
import type { ParsedTransaction, AIInsight, Anomaly } from '@/lib/geminiAI';
import { InsightEngine as AdvancedInsightEngine } from '@/ai/insight-engine/InsightEngine';
import { AIReportGenerator as AdvancedReportGenerator } from '@/ai/report-generator/AIReportGenerator';

export type AIRequestType = 
  | 'chart_generation'
  | 'insight_generation'
  | 'educational_content'
  | 'report_generation'
  | 'data_analysis'
  | 'document_processing'
  | 'anomaly_detection';

export interface AIRequestContext {
  userId?: string;
  userRole?: 'premium' | 'free';
  locale?: string;
  sessionId?: string;
  requestId?: string;
}

export interface ComplianceCheck {
  approved: boolean;
  reason?: string;
  warnings?: string[];
  dataRetention?: {
    enabled: boolean;
    duration?: string;
  };
  gdprCompliant?: boolean;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  compliance?: ComplianceCheck;
  latency?: number;
  cached?: boolean;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    confidence?: number;
  };
}

// Compliance Engine - Wrapper per ComplianceEngine avanzato
import { ComplianceEngine as AdvancedComplianceEngine, type ComplianceValidationResult } from './compliance/ComplianceEngine';

class ComplianceEngine {
  private apiKey: string;
  private advancedEngine: AdvancedComplianceEngine;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_LOVABLE_API_KEY || '';
    // Only log warning in development and if actually needed
    if (import.meta.env.DEV && !this.apiKey) {
      // Warning solo in dev mode, non bloccante
      console.debug('[AI] LOVABLE_API_KEY not configured. AI features will be limited.');
    }
    this.advancedEngine = new AdvancedComplianceEngine();
  }

  async validateRequest(
    type: AIRequestType,
    data: any,
    context: AIRequestContext
  ): Promise<ComplianceCheck> {
    console.log('[ComplianceEngine] Validating request with advanced engine:', type);

    // Usa ComplianceEngine avanzato per validazione completa
    const advancedResult: ComplianceValidationResult = await this.advancedEngine.validateRequest(
      type,
      data,
      context
    );

    // Converte risultato avanzato in formato ComplianceCheck compatibile
    const checks: ComplianceCheck = {
      approved: advancedResult.approved,
      reason: advancedResult.reason,
      warnings: advancedResult.details || [],
      gdprCompliant: advancedResult.approved && !advancedResult.complianceViolation?.type.includes('GDPR'),
      dataRetention: {
        enabled: true,
        duration: '30 days'
      }
    };

    // Aggiungi warning per API key se mancante
    if (type === 'chart_generation' && !this.apiKey) {
      checks.warnings?.push('API key not available - using fallback data');
    }

    // Se non approvato, logga il motivo
    if (!advancedResult.approved) {
      console.warn('[ComplianceEngine] Request rejected:', {
        reason: advancedResult.reason,
        details: advancedResult.details,
        violation: advancedResult.complianceViolation,
        alternative: advancedResult.alternative
      });
    }

    // Aggiungi required disclaimers come warnings
    if (advancedResult.requiredDisclaimers && advancedResult.requiredDisclaimers.length > 0) {
      checks.warnings?.push(`Required disclaimers: ${advancedResult.requiredDisclaimers.join(', ')}`);
    }

    return checks;
  }

  generateComplianceResponse(check: ComplianceCheck): AIResponse {
    return {
      success: false,
      error: check.reason || 'Request not compliant',
      compliance: check
    };
  }
}

// Data Analyzer
class DataAnalyzer {
  async analyzeFinancialData(data: {
    expenses?: any[];
    investments?: any[];
    transactions?: ParsedTransaction[];
    timeframe?: string;
  }): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[DataAnalyzer] Analyzing financial data');

      const analysis: any = {
        summary: {},
        patterns: [],
        recommendations: []
      };

      // Analisi spese
      if (data.expenses && data.expenses.length > 0) {
        const totalExpenses = data.expenses
          .filter((e: any) => e.type === 'Expense')
          .reduce((sum: number, e: any) => sum + e.amount, 0);
        
        const totalIncome = data.expenses
          .filter((e: any) => e.type === 'Income')
          .reduce((sum: number, e: any) => sum + e.amount, 0);

        analysis.summary.totalExpenses = totalExpenses;
        analysis.summary.totalIncome = totalIncome;
        analysis.summary.netBalance = totalIncome - totalExpenses;
        analysis.summary.savingsRate = totalIncome > 0 
          ? ((totalIncome - totalExpenses) / totalIncome) * 100 
          : 0;

        // Pattern detection
        const categoryBreakdown = data.expenses
          .filter((e: any) => e.type === 'Expense')
          .reduce((acc: Record<string, number>, e: any) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
          }, {});

        const topCategory = Object.entries(categoryBreakdown)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];

        analysis.patterns.push({
          type: 'spending_category',
          topCategory: topCategory?.[0],
          percentage: topCategory 
            ? ((topCategory[1] as number) / totalExpenses) * 100 
            : 0
        });
      }

      // Analisi investimenti
      if (data.investments && data.investments.length > 0) {
        const totalValue = data.investments.reduce(
          (sum: number, inv: any) => sum + (inv.currentPrice * inv.quantity),
          0
        );
        const totalCost = data.investments.reduce(
          (sum: number, inv: any) => sum + (inv.purchasePrice * inv.quantity),
          0
        );

        analysis.summary.totalInvestments = totalValue;
        analysis.summary.totalGain = totalValue - totalCost;
        analysis.summary.returnPercentage = totalCost > 0 
          ? ((totalValue - totalCost) / totalCost) * 100 
          : 0;
      }

      // Genera raccomandazioni base
      if (analysis.summary.savingsRate < 20) {
        analysis.recommendations.push({
          type: 'savings',
          message: 'Il tuo tasso di risparmio è inferiore al 20%. Considera di ridurre le spese non essenziali.',
          priority: 'high'
        });
      }

      return {
        success: true,
        data: analysis,
        latency: Date.now() - startTime,
        metadata: {
          confidence: 0.85
        }
      };
    } catch (error) {
      console.error('[DataAnalyzer] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      };
    }
  }
}

// Insight Engine wrapper per compatibilità con CoreAIEngine
class InsightEngine {
  private advancedEngine: AdvancedInsightEngine;

  constructor() {
    this.advancedEngine = new AdvancedInsightEngine();
  }

  async generateInsights(data: {
    expenses?: any[];
    investments?: any[];
    goals?: any[];
    scope?: 'dashboard' | 'detailed';
  }): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[InsightEngine] Generating comprehensive insights');

      // Usa il nuovo InsightEngine avanzato
      const result = await this.advancedEngine.generateInsights({
        expenses: data.expenses,
        investments: data.investments,
        goals: data.goals,
        scope: data.scope || 'dashboard'
      });

      // Converte il risultato avanzato in formato compatibile
      const insights = [
        // Insights di spesa
        ...result.spendingInsights.map(insight => ({
          type: insight.type,
          title: insight.title,
          description: insight.description,
          actionable: insight.actionable,
          impact: insight.impact,
          category: insight.category
        })),
        // Opportunità di risparmio
        ...result.savingOpportunities.map(opp => ({
          type: 'tip',
          title: `Opportunità di risparmio: ${opp.area}`,
          description: opp.description,
          actionable: true,
          impact: opp.priority === 'high' ? 'high' as const : opp.priority === 'medium' ? 'medium' as const : 'low' as const
        })),
        // Insights investimenti
        ...result.investmentInsights.map(insight => ({
          type: insight.type === 'risk' ? 'warning' as const : 'info' as const,
          title: insight.title,
          description: insight.description,
          actionable: true,
          impact: insight.priority === 'high' ? 'high' as const : 'medium' as const
        })),
        // Risk alerts
        ...result.riskAlerts.map(alert => ({
          type: alert.level === 'high' ? 'warning' as const : 'info' as const,
          title: alert.title,
          description: alert.description,
          actionable: !!alert.action,
          impact: alert.level
        }))
      ];

      return {
        success: true,
        data: { 
          insights,
          financialHealth: result.financialHealth,
          recommendations: result.recommendations
        },
        latency: Date.now() - startTime,
        metadata: {
          confidence: 0.85
        }
      };
    } catch (error) {
      console.error('[InsightEngine] Error:', error);
      
      // Fallback a insights base
      return {
        success: true,
        data: {
          insights: [{
            type: 'info',
            title: 'Inizia a tracciare le tue spese',
            description: 'Aggiungi transazioni per ricevere insights personalizzati',
            actionable: true
          }]
        },
        latency: Date.now() - startTime
      };
    }
  }
}

// AI Educator
class AIEducator {
  async generateLesson(data: {
    topic?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    userData?: any;
  }): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[AIEducator] Generating lesson:', data.topic);

      const apiKey = import.meta.env.VITE_LOVABLE_API_KEY || '';
      if (!apiKey) {
        // Fallback senza AI
        return {
          success: true,
          data: {
            content: `Contenuto educativo su ${data.topic || 'finanza generale'}.\n\n*Nota: Contenuto educativo automatizzato. Per consulenza finanziaria personalizzata, consulta un professionista abilitato.*`,
            topic: data.topic || 'finanza generale',
            level: data.level || 'beginner',
            compliance: {
              educational: true,
              noAdvice: true,
              gdprCompliant: true
            }
          },
          latency: Date.now() - startTime
        };
      }

      const prompt = data.topic 
        ? `Crea una lezione educativa su "${data.topic}" in italiano, livello ${data.level || 'beginner'}.`
        : 'Genera contenuto educativo finanziario generale in italiano.';

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Sei un educatore finanziario. Genera contenuti educativi in italiano, conformi a GDPR. Non fornire consulenza finanziaria, solo educazione.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || '';

      return {
        success: true,
        data: {
          content,
          topic: data.topic || 'finanza generale',
          level: data.level || 'beginner',
          compliance: {
            educational: true,
            noAdvice: true,
            gdprCompliant: true
          }
        },
        latency: Date.now() - startTime,
        metadata: {
          model: 'gemini-2.5-flash',
          tokensUsed: aiData.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('[AIEducator] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      };
    }
  }
}

// Report Generator wrapper per compatibilità con CoreAIEngine
class AIReportGenerator {
  private advancedGenerator: AdvancedReportGenerator;

  constructor() {
    this.advancedGenerator = new AdvancedReportGenerator();
  }

  async generateReport(data: {
    type: 'monthly' | 'quarterly' | 'annual' | 'custom';
    format: 'pdf' | 'csv';
    expenses?: any[];
    investments?: any[];
    goals?: any[];
  }): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[AIReportGenerator] Generating report:', data.type);

      // Ottieni userId
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Determina timeframe basato su type
      let timeframe = '1M';
      if (data.type === 'quarterly') timeframe = '3M';
      else if (data.type === 'annual') timeframe = '1Y';
      else if (data.type === 'monthly') timeframe = '1M';

      // Usa il nuovo AdvancedReportGenerator
      const result = await this.advancedGenerator.generateReport({
        type: data.type === 'custom' ? 'custom' : data.type,
        timeframe,
        userId: user.id,
        format: data.format || 'pdf'
      });

      return {
        success: result.success,
        data: {
          reportType: data.type,
          format: data.format,
          executiveSummary: result.report.executiveSummary,
          sections: result.report.sections,
          keyFindings: result.report.keyFindings,
          recommendations: result.report.recommendations,
          visualizations: result.report.visualizations,
          generatedAt: result.report.metadata.generatedAt
        },
        latency: Date.now() - startTime,
        compliance: {
          approved: true
        }
      };
    } catch (error) {
      console.error('[AIReportGenerator] Error:', error);
      
      // Fallback a export semplice
      try {
        const totalIncome = (data.expenses || [])
          .filter((e: any) => e.type === 'Income')
          .reduce((sum: number, e: any) => sum + e.amount, 0);
        
        const totalExpenses = (data.expenses || [])
          .filter((e: any) => e.type === 'Expense')
          .reduce((sum: number, e: any) => sum + e.amount, 0);

        const portfolioValue = (data.investments || [])
          .reduce((sum: number, inv: any) => sum + (inv.currentPrice * inv.quantity), 0);

        const exportData: ExportData = {
          expenses: data.expenses || [],
          investments: data.investments || [],
          goals: data.goals || [],
          summary: {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            portfolioValue
          }
        };

        if (data.format === 'pdf') {
          exportToPDF(exportData);
        } else {
          exportToCSV(exportData);
        }

        return {
          success: true,
          data: {
            reportType: data.type,
            format: data.format,
            summary: exportData.summary,
            generatedAt: new Date().toISOString()
          },
          latency: Date.now() - startTime
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          latency: Date.now() - startTime
        };
      }
    }
  }

  /**
   * Genera Financial Health Report (metodo aggiuntivo)
   */
  async generateFinancialHealthReport(userData: {
    expenses?: any[];
    investments?: any[];
    goals?: any[];
  }): Promise<any> {
    return await this.advancedGenerator.generateFinancialHealthReport(userData);
  }
}

// Core AI Engine
class CoreAIEngine {
  private compliance: ComplianceEngine;
  private dataAnalyzer: DataAnalyzer;
  private chartGenerator: typeof aiChartGenerator;
  private insightEngine: InsightEngine;
  private educator: AIEducator;
  private reportGenerator: AIReportGenerator;
  private initialized: boolean;

  constructor() {
    this.compliance = new ComplianceEngine();
    this.dataAnalyzer = new DataAnalyzer();
    this.chartGenerator = aiChartGenerator;
    this.insightEngine = new InsightEngine();
    this.educator = new AIEducator();
    this.reportGenerator = new AIReportGenerator();
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[CoreAIEngine] Already initialized');
      return;
    }

    console.log('[CoreAIEngine] Initializing...');
    
    try {
      // Verifica API key
      const apiKey = import.meta.env.VITE_LOVABLE_API_KEY || '';
      if (!apiKey) {
        console.warn('[CoreAIEngine] No API key - some features will be limited');
      }

      // Setup real-time processing listeners (se necessario)
      this.setupRealTimeProcessing();
      
      this.initialized = true;
      console.log('[CoreAIEngine] Initialized successfully');
    } catch (error) {
      console.error('[CoreAIEngine] Initialization error:', error);
      throw error;
    }
  }

  private setupRealTimeProcessing(): void {
    // Placeholder per processing real-time
    console.log('[CoreAIEngine] Real-time processing setup');
  }

  /**
   * Processo centrale per tutte le richieste AI
   */
  async processRequest(
    type: AIRequestType,
    data: any,
    context: AIRequestContext = {}
  ): Promise<AIResponse> {
    const requestStartTime = Date.now();
    const requestId = context.requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[CoreAIEngine] Processing request: ${type}`, { requestId, userId: context.userId });

    try {
      // 1. Validazione compliance
      const complianceCheck = await this.compliance.validateRequest(type, data, context);
      if (!complianceCheck.approved) {
        console.warn(`[CoreAIEngine] Request rejected by compliance: ${complianceCheck.reason}`);
        return this.compliance.generateComplianceResponse(complianceCheck);
      }

      // 2. Routing alle diverse AI specializzate
      let result: AIResponse;

      switch (type) {
        case 'chart_generation':
          const chartRequest: ChartRequest = {
            type: data.type,
            timeframe: data.timeframe,
            symbols: data.symbols,
            userId: context.userId,
            dataSource: data.dataSource,
            prompt: data.prompt
          };
          const chartResult = await this.chartGenerator.generateSmartChart(chartRequest);
          result = {
            success: chartResult.success,
            data: chartResult,
            compliance: complianceCheck,
            latency: Date.now() - requestStartTime
          };
          break;

        case 'insight_generation':
          result = await this.insightEngine.generateInsights({
            expenses: data.expenses,
            investments: data.investments,
            goals: data.goals,
            scope: data.scope || 'dashboard'
          });
          result.compliance = complianceCheck;
          break;

        case 'educational_content':
          result = await this.educator.generateLesson({
            topic: data.topic,
            level: data.level,
            userData: data.userData
          });
          result.compliance = complianceCheck;
          break;

        case 'report_generation':
          result = await this.reportGenerator.generateReport({
            type: data.type || 'monthly',
            format: data.format || 'pdf',
            expenses: data.expenses,
            investments: data.investments,
            goals: data.goals
          });
          result.compliance = complianceCheck;
          break;

        case 'data_analysis':
          result = await this.dataAnalyzer.analyzeFinancialData({
            expenses: data.expenses,
            investments: data.investments,
            transactions: data.transactions,
            timeframe: data.timeframe
          });
          result.compliance = complianceCheck;
          break;

        case 'document_processing':
          if (!context.userId) {
            throw new Error('UserId required for document processing');
          }
          const docResult = await geminiAI.processFinancialDocument(
            data.fileContent,
            data.fileType,
            context.userId,
            {
              enableAnomalyDetection: data.enableAnomalyDetection !== false,
              enableInsights: data.enableInsights !== false,
              enableSummarization: data.enableSummarization !== false,
              customCategories: data.customCategories
            }
          );
          result = {
            success: true,
            data: docResult,
            compliance: complianceCheck,
            latency: Date.now() - requestStartTime,
            metadata: {
              confidence: docResult.confidence
            }
          };
          break;

        case 'anomaly_detection':
          if (!data.transactions || data.transactions.length === 0) {
            throw new Error('Transactions required for anomaly detection');
          }
          const anomalies = await geminiAI.detectAnomalies(data.transactions);
          result = {
            success: true,
            data: { anomalies },
            compliance: complianceCheck,
            latency: Date.now() - requestStartTime
          };
          break;

        default:
          console.warn(`[CoreAIEngine] Unknown request type: ${type}`);
          result = this.generateFallbackResponse(type);
          result.compliance = complianceCheck;
      }

      // 3. Logging e audit
      if (context.userId) {
        console.log(`[CoreAIEngine] Request completed: ${requestId}`, {
          type,
          userId: context.userId,
          latency: result.latency,
          success: result.success
        });
      }

      return result;
    } catch (error) {
      console.error('[CoreAIEngine] Error processing request:', error);
      return this.generateErrorResponse(error, requestStartTime);
    }
  }

  private generateFallbackResponse(type: AIRequestType): AIResponse {
    return {
      success: false,
      error: `Request type '${type}' not supported`,
      data: null
    };
  }

  private generateErrorResponse(error: unknown, startTime: number): AIResponse {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      latency: Date.now() - startTime,
      compliance: {
        approved: false,
        reason: 'Error during processing'
      }
    };
  }

  /**
   * Helper per ottenere context utente
   */
  async getUserContext(): Promise<AIRequestContext> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {};
      }

      // Check user profile per role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      return {
        userId: user.id,
        userRole: profile?.subscription_tier === 'premium' ? 'premium' : 'free',
        locale: 'it-IT',
        sessionId: `session-${Date.now()}`
      };
    } catch (error) {
      console.error('[CoreAIEngine] Error getting user context:', error);
      return {};
    }
  }

  /**
   * Getter per verificare se è inizializzato
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const coreAIEngine = new CoreAIEngine();

// Initialize on module load (non-blocking)
coreAIEngine.initialize().catch(err => {
  console.error('[CoreAIEngine] Failed to initialize:', err);
});

export default coreAIEngine;

