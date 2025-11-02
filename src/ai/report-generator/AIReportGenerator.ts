// AI Report Generator - Genera report finanziari avanzati con analisi AI
import { InsightEngine, type ComprehensiveAnalysis, type InsightResult } from '@/ai/insight-engine/InsightEngine';
import { FinancialHealthScorer } from '@/ai/insight-engine/FinancialHealthScorer';
import { ReportTemplateEngine, type ReportType } from './ReportTemplateEngine';
import { ReportDataProcessor, type ReportData, type ProcessedReportData } from './ReportDataProcessor';
import { ReportVisualizationEngine, type ReportVisualization } from './ReportVisualizationEngine';
import { exportToPDF, exportToCSV, type ExportData } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { geminiAI } from '@/lib/geminiAI';

export interface ReportRequest {
  type: ReportType;
  timeframe: string;
  userId: string;
  sections?: string[];
  format?: 'pdf' | 'csv' | 'json';
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  data?: any;
  charts?: string[]; // IDs delle visualizzazioni associate
}

export interface KeyFinding {
  title: string;
  description: string;
  category: 'spending' | 'savings' | 'investments' | 'risk' | 'opportunity';
  impact: 'high' | 'medium' | 'low';
  data?: any;
}

export interface ComplianceNotice {
  educational: boolean;
  noAdvice: boolean;
  gdprCompliant: boolean;
  disclaimer: string;
}

export interface ReportResult {
  success: boolean;
  report: {
    metadata: {
      type: string;
      timeframe: string;
      generatedAt: string;
      userId: string;
    };
    executiveSummary: string;
    sections: ReportSection[];
    visualizations: ReportVisualization[];
    keyFindings: KeyFinding[];
    recommendations: ActionableRecommendation[];
    compliance: ComplianceNotice;
  };
}

export interface FinancialHealthReport {
  score: number;
  categoryScores: {
    spending: number;
    savings: number;
    investments: number;
    debt: number;
    protection: number;
  };
  strengths: string[];
  improvements: Array<{
    category: string;
    description: string;
    actions: Array<{
      description: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
    }>;
    expectedImprovement: string;
    suggestedTimeline: string;
  }>;
  trend: {
    direction: 'improving' | 'stable' | 'declining';
    change: number;
  };
  comparison: {
    percentile: number;
    description: string;
  };
  actionPlan: ActionPlanItem[];
}

export interface ActionPlanItem {
  area: string;
  issue: string;
  suggestedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
    educationalResources?: string[];
  }>;
  expectedOutcome: string;
  timeline: string;
}

export interface ActionableRecommendation {
  type: string;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export class AIReportGenerator {
  private templateEngine: ReportTemplateEngine;
  private dataProcessor: ReportDataProcessor;
  private visualizationEngine: ReportVisualizationEngine;
  private insightEngine: InsightEngine;
  private healthScorer: FinancialHealthScorer;

  constructor() {
    this.templateEngine = new ReportTemplateEngine();
    this.dataProcessor = new ReportDataProcessor();
    this.visualizationEngine = new ReportVisualizationEngine();
    this.insightEngine = new InsightEngine();
    this.healthScorer = new FinancialHealthScorer();
  }

  /**
   * Genera report completo con analisi AI
   */
  async generateReport(reportRequest: ReportRequest): Promise<ReportResult> {
    const { type, timeframe, userId, sections, format = 'pdf' } = reportRequest;
    
    console.log(`[AIReportGenerator] Generating ${type} report for user ${userId}`);

    try {
      // 1. Raccogli dati completi
      const reportData = await this.collectReportData(userId, timeframe);
      
      // 2. Elabora dati
      const processedData = this.dataProcessor.processData(reportData);
      
      // 3. Analisi AI avanzata usando InsightEngine
      const analysis = await this.analyzeReportData(reportData);
      
      // 4. Genera contenuto del report
      const reportContent = await this.generateReportContent(analysis, processedData, type);
      
      // 5. Crea visualizzazioni
      const visualizations = await this.createReportVisualizations(analysis, processedData);
      
      // 6. Genera report nel formato richiesto
      if (format === 'pdf') {
        await this.exportReportPDF(reportContent, visualizations, reportData);
      } else if (format === 'csv') {
        this.exportReportCSV(reportData);
      }

      return {
        success: true,
        report: {
          metadata: {
            type,
            timeframe,
            generatedAt: new Date().toISOString(),
            userId
          },
          executiveSummary: reportContent.executiveSummary,
          sections: reportContent.sections,
          visualizations,
          keyFindings: reportContent.keyFindings,
          recommendations: reportContent.recommendations,
          compliance: this.generateReportComplianceNotice()
        }
      };
    } catch (error) {
      console.error('[AIReportGenerator] Error generating report:', error);
      throw error;
    }
  }

  /**
   * Genera Financial Health Report dedicato
   */
  async generateFinancialHealthReport(userData: {
    expenses?: any[];
    investments?: any[];
    goals?: any[];
  }): Promise<FinancialHealthReport> {
    console.log('[AIReportGenerator] Generating Financial Health Report');

    // Usa InsightEngine per analisi completa
    const insights = await this.insightEngine.generateInsights(userData);
    const healthScore = insights.financialHealth;
    
    // Raccoglie dati per analisi
    const reportData = {
      expenses: userData.expenses || [],
      investments: userData.investments || [],
      goals: userData.goals || [],
      summary: {
        totalIncome: (userData.expenses || [])
          .filter(e => e.type === 'Income')
          .reduce((sum, e) => sum + e.amount, 0),
        totalExpenses: (userData.expenses || [])
          .filter(e => e.type === 'Expense')
          .reduce((sum, e) => sum + e.amount, 0),
        netBalance: 0,
        portfolioValue: (userData.investments || [])
          .reduce((sum, inv) => sum + (inv.currentPrice * inv.quantity), 0)
      },
      timeframe: {
        start: '',
        end: '',
        period: 'current'
      }
    };

    const analysis = await this.analyzeReportData(reportData);
    
    return {
      score: healthScore.overall,
      categoryScores: {
        spending: healthScore.breakdown.spending,
        savings: healthScore.breakdown.savings,
        investments: healthScore.breakdown.investments,
        debt: healthScore.breakdown.debt,
        protection: healthScore.breakdown.emergency
      },
      strengths: this.identifyStrengths(analysis),
      improvements: this.identifyImprovements(analysis, insights),
      trend: healthScore.trends,
      comparison: this.generatePeerComparison(healthScore.overall),
      actionPlan: this.generateActionPlan(analysis, insights)
    };
  }

  /**
   * Genera Action Plan basato su analisi e insights
   */
  generateActionPlan(
    analysis: ComprehensiveAnalysis,
    insights: InsightResult
  ): ActionPlanItem[] {
    return insights.recommendations.map(rec => ({
      area: rec.category,
      issue: rec.description,
      suggestedActions: [{
        action: rec.action,
        priority: rec.priority,
        estimatedImpact: this.estimateImpact(rec, analysis),
        educationalResources: this.getRelatedEducationalContent(rec.category)
      }],
      expectedOutcome: this.calculateExpectedOutcome(rec, analysis),
      timeline: this.estimateTimeline(rec.priority)
    }));
  }

  /**
   * Raccoglie dati per il report
   */
  private async collectReportData(userId: string, timeframe: string): Promise<ReportData> {
    return await this.dataProcessor.collectReportData(userId, timeframe);
  }

  /**
   * Analizza dati del report usando InsightEngine
   */
  private async analyzeReportData(reportData: ReportData): Promise<ComprehensiveAnalysis> {
    // Genera insights per ottenere analisi completa
    const insights = await this.insightEngine.generateInsights({
      expenses: reportData.expenses,
      investments: reportData.investments,
      goals: reportData.goals,
      scope: 'detailed'
    });

    // Costruisce ComprehensiveAnalysis dai dati reali
    return this.buildAnalysisFromData(reportData, insights);
  }

  /**
   * Costruisce ComprehensiveAnalysis dai dati e insights
   */
  private buildAnalysisFromData(reportData: ReportData, insights: InsightResult): ComprehensiveAnalysis {
    // Spending categories
    const spendingByCategory: Record<string, number> = {};
    reportData.expenses
      .filter((e: any) => e.type === 'Expense')
      .forEach((expense: any) => {
        const category = expense.category || 'Other';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + expense.amount;
      });

    // Savings rate
    const totalIncome = reportData.summary.totalIncome;
    const totalExpenses = reportData.summary.totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Goal progress
    const goalProgress = (reportData.goals || []).map((goal: any) => ({
      goalId: goal.id || goal.goal_id || 'unknown',
      goalName: goal.name || goal.title || 'Obiettivo',
      currentAmount: goal.current_amount || goal.currentAmount || 0,
      targetAmount: goal.target_amount || goal.targetAmount || 1,
      progress: (goal.target_amount || goal.targetAmount) > 0 
        ? ((goal.current_amount || goal.currentAmount || 0) / (goal.target_amount || goal.targetAmount)) * 100 
        : 0,
      timeframe: goal.deadline || goal.timeframe || 'N/A'
    }));

    // Portfolio metrics
    const portfolioValue = reportData.summary.portfolioValue;
    const totalCost = (reportData.investments || []).reduce(
      (sum: number, inv: any) => sum + ((inv.purchase_price || inv.purchasePrice || 0) * (inv.quantity || 0)),
      0
    );
    const totalReturn = totalCost > 0 ? ((portfolioValue - totalCost) / totalCost) * 100 : 0;

    // Diversification
    const byType: Record<string, number> = {};
    (reportData.investments || []).forEach((inv: any) => {
      const value = (inv.current_price || inv.currentPrice || 0) * (inv.quantity || 0);
      const type = inv.type || 'Unknown';
      byType[type] = (byType[type] || 0) + value;
    });

    const totalInvestmentsValue = Object.values(byType).reduce((sum: number, val: number) => sum + val, 0);
    const diversificationScore = Object.keys(byType).length >= 3 ? 0.75 : Object.keys(byType).length >= 2 ? 0.5 : 0.25;

    return {
      spending: {
        categories: spendingByCategory,
        trends: insights.spendingInsights
          .filter(ins => ins.category)
          .map(ins => ({
            category: ins.category || 'Unknown',
            direction: ins.type === 'warning' ? 'increasing' as const : 'stable' as const,
            change: 0,
            period: '1M'
          })),
        anomalies: insights.riskAlerts
          .filter(a => a.category === 'spending')
          .map(a => ({
            type: 'unusual_amount' as const,
            description: a.description,
            amount: 0,
            date: new Date().toISOString(),
            severity: a.level === 'high' ? 'high' as const : a.level === 'medium' ? 'medium' as const : 'low' as const
          })),
        recurring: [] // TODO: implementare rilevamento spese ricorrenti
      },
      savings: {
        rate: savingsRate,
        progress: goalProgress,
        efficiency: savingsRate * 0.6 + (portfolioValue / Math.max(totalIncome, 1)) * 40
      },
      investments: {
        performance: {
          totalReturn,
          totalValue: portfolioValue,
          totalCost,
          annualizedReturn: totalReturn, // Simplified
          volatility: 0, // TODO: calcolare da dati storici
          sharpeRatio: 0 // TODO: calcolare
        },
        diversification: {
          score: diversificationScore,
          byType,
          byAsset: {},
          recommendations: insights.investmentInsights
            .filter(ins => ins.type === 'diversification')
            .map(ins => ins.recommendation)
        },
        risk: {
          level: insights.riskAlerts.some(a => a.category === 'investments' && a.level === 'high') ? 'high' as const
            : insights.riskAlerts.some(a => a.category === 'investments') ? 'medium' as const
            : 'low' as const,
          factors: insights.riskAlerts
            .filter(a => a.category === 'investments')
            .map(a => a.description),
          score: insights.riskAlerts.filter(a => a.category === 'investments').length * 20
        },
        costs: {
          total: portfolioValue,
          fees: portfolioValue * 0.002, // Stima
          taxes: 0,
          recommendations: []
        }
      },
      behavioral: {
        consistency: {
          score: insights.financialHealth?.overall || 50,
          trackingFrequency: 70, // Placeholder
          budgetAdherence: 70, // Placeholder
          goalProgress: goalProgress.length > 0
            ? goalProgress.reduce((sum, g) => sum + g.progress, 0) / goalProgress.length
            : 0
        },
        habits: [],
        opportunities: insights.savingOpportunities.map(opp => ({
          area: opp.area,
          potential: opp.potential,
          difficulty: opp.difficulty,
          timeframe: opp.timeframe,
          description: opp.description
        }))
      }
    };
  }

  /**
   * Genera contenuto del report con AI
   */
  private async generateReportContent(
    analysis: ComprehensiveAnalysis,
    processedData: ProcessedReportData,
    type: ReportType
  ): Promise<{
    executiveSummary: string;
    sections: ReportSection[];
    keyFindings: KeyFinding[];
    recommendations: ActionableRecommendation[];
  }> {
    const template = this.templateEngine.getTemplate(type);
    
    // Genera executive summary con AI
    const executiveSummary = await this.generateExecutiveSummary(analysis, processedData);
    
    // Genera sezioni del report
    const sections = await this.generateSections(analysis, processedData, template.sections);
    
    // Identifica key findings
    const keyFindings = this.identifyKeyFindings(analysis, processedData);
    
    // Genera raccomandazioni
    const recommendations = await this.generateRecommendations(analysis, processedData);

    return {
      executiveSummary,
      sections,
      keyFindings,
      recommendations
    };
  }

  /**
   * Genera executive summary con AI
   */
  private async generateExecutiveSummary(
    analysis: ComprehensiveAnalysis,
    processedData: ProcessedReportData
  ): Promise<string> {
    const apiKey = import.meta.env.VITE_LOVABLE_API_KEY || '';
    
    if (!apiKey) {
      // Fallback senza AI
      return `Report finanziario generato il ${new Date().toLocaleDateString('it-IT')}. 
        Tasso di risparmio: ${processedData.savingsRate.toFixed(1)}%. 
        Valore portafoglio: €${processedData.summary.portfolioValue.toFixed(2)}.`;
    }

    try {
      const prompt = `Genera un executive summary di 3-4 frasi in italiano per un report finanziario con:
        - Tasso di risparmio: ${processedData.savingsRate.toFixed(1)}%
        - Reddito totale: €${processedData.summary.totalIncome.toFixed(2)}
        - Spese totali: €${processedData.summary.totalExpenses.toFixed(2)}
        - Valore portafoglio: €${processedData.summary.portfolioValue.toFixed(2)}
        
        Sii conciso e professionale.`;

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
              content: 'Sei un esperto analista finanziario. Genera executive summary concisi e professionali in italiano.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (error) {
      console.warn('[AIReportGenerator] AI summary failed, using fallback:', error);
    }

    // Fallback
    return `Report finanziario generato il ${new Date().toLocaleDateString('it-IT')}. 
      Tasso di risparmio: ${processedData.savingsRate.toFixed(1)}%. 
      Valore portafoglio: €${processedData.summary.portfolioValue.toFixed(2)}.`;
  }

  /**
   * Genera sezioni del report
   */
  private async generateSections(
    analysis: ComprehensiveAnalysis,
    processedData: ProcessedReportData,
    sectionIds: string[]
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];

    for (const sectionId of sectionIds) {
      if (!this.templateEngine.isValidSection(sectionId)) continue;

      let section: ReportSection;

      switch (sectionId) {
        case 'spending':
          section = {
            id: 'spending',
            title: 'Analisi Spese',
            content: this.generateSpendingSection(analysis, processedData),
            data: { categories: processedData.spendingByCategory }
          };
          break;
        case 'savings':
          section = {
            id: 'savings',
            title: 'Analisi Risparmi',
            content: this.generateSavingsSection(analysis, processedData),
            data: { rate: processedData.savingsRate }
          };
          break;
        case 'investments':
          section = {
            id: 'investments',
            title: 'Analisi Investimenti',
            content: this.generateInvestmentsSection(analysis),
            data: analysis.investments
          };
          break;
        default:
          section = {
            id: sectionId,
            title: sectionId,
            content: `Sezione ${sectionId}`
          };
      }

      sections.push(section);
    }

    return sections;
  }

  /**
   * Genera contenuto sezione spese
   */
  private generateSpendingSection(analysis: ComprehensiveAnalysis, processedData: ProcessedReportData): string {
    const topCategory = Object.entries(processedData.spendingByCategory)
      .sort(([, a], [, b]) => b - a)[0];

    return `Le tue spese totali ammontano a €${processedData.summary.totalExpenses.toFixed(2)}.
      La categoria principale è ${topCategory?.[0] || 'N/A'} con €${topCategory?.[1]?.toFixed(2) || '0'}.
      ${analysis.spending.anomalies.length > 0 ? `Sono state rilevate ${analysis.spending.anomalies.length} anomalie di spesa.` : ''}`;
  }

  /**
   * Genera contenuto sezione risparmi
   */
  private generateSavingsSection(analysis: ComprehensiveAnalysis, processedData: ProcessedReportData): string {
    return `Il tuo tasso di risparmio è del ${processedData.savingsRate.toFixed(1)}%.
      ${processedData.goalProgress.length > 0 ? `Stai tracciando ${processedData.goalProgress.length} obiettivi finanziari.` : ''}
      ${processedData.savingsRate >= 20 ? 'Ottimo! Hai raggiunto l\'obiettivo raccomandato del 20%.' : 'Considera di aumentare il tasso di risparmio al 20% per una maggiore sicurezza finanziaria.'}`;
  }

  /**
   * Genera contenuto sezione investimenti
   */
  private generateInvestmentsSection(analysis: ComprehensiveAnalysis): string {
    const perf = analysis.investments.performance;
    return `Il valore totale del portafoglio è €${perf.totalValue.toFixed(2)}.
      Rendimento totale: ${perf.totalReturn > 0 ? '+' : ''}${perf.totalReturn.toFixed(2)}%.
      Diversificazione: ${(analysis.investments.diversification.score * 100).toFixed(1)}/100.
      ${analysis.investments.risk.level === 'high' ? 'Attenzione: rischio elevato rilevato.' : ''}`;
  }

  /**
   * Identifica key findings
   */
  private identifyKeyFindings(
    analysis: ComprehensiveAnalysis,
    processedData: ProcessedReportData
  ): KeyFinding[] {
    const findings: KeyFinding[] = [];

    // Finding: Savings rate
    if (processedData.savingsRate < 20) {
      findings.push({
        title: 'Tasso di risparmio sotto il target',
        description: `Il tasso di risparmio è del ${processedData.savingsRate.toFixed(1)}%, sotto il target raccomandato del 20%`,
        category: 'savings',
        impact: 'high'
      });
    }

    // Finding: Portfolio performance
    if (analysis.investments.performance.totalReturn > 10) {
      findings.push({
        title: 'Portafoglio in performance positiva',
        description: `Il portafoglio ha generato un rendimento del ${analysis.investments.performance.totalReturn.toFixed(2)}%`,
        category: 'investments',
        impact: 'high',
        data: { return: analysis.investments.performance.totalReturn }
      });
    }

    // Finding: Spending anomalies
    if (analysis.spending.anomalies.length > 0) {
      findings.push({
        title: 'Anomalie di spesa rilevate',
        description: `${analysis.spending.anomalies.length} transazione/i anomala/e individuata/e`,
        category: 'spending',
        impact: 'medium'
      });
    }

    return findings;
  }

  /**
   * Genera raccomandazioni
   */
  private async generateRecommendations(
    analysis: ComprehensiveAnalysis,
    processedData: ProcessedReportData
  ): Promise<ActionableRecommendation[]> {
    const recommendations: ActionableRecommendation[] = [];

    // Raccomandazione: Savings rate
    if (processedData.savingsRate < 20) {
      recommendations.push({
        type: 'savings_opportunity',
        title: 'Aumenta il tasso di risparmio',
        description: 'Il tuo tasso di risparmio è inferiore al target del 20%',
        action: 'Analizza le spese discrezionali e identifica opportunità di risparmio',
        priority: 'high',
        category: 'savings'
      });
    }

    // Raccomandazione: Diversification
    if (analysis.investments.diversification.score < 0.7) {
      recommendations.push({
        type: 'diversification_educational',
        title: 'Migliora la diversificazione del portafoglio',
        description: 'Il portafoglio mostra concentrazione in poche asset class',
        action: 'Studia i principi di diversificazione e considera di aggiungere nuove asset class',
        priority: 'medium',
        category: 'investments'
      });
    }

    return recommendations;
  }

  /**
   * Crea visualizzazioni per il report
   */
  private async createReportVisualizations(
    analysis: ComprehensiveAnalysis,
    processedData?: ProcessedReportData
  ): Promise<ReportVisualization[]> {
    return await this.visualizationEngine.createReportVisualizations(analysis, processedData);
  }

  /**
   * Export report come PDF
   */
  private async exportReportPDF(
    content: { sections: ReportSection[] },
    visualizations: ReportVisualization[],
    data: ReportData
  ): Promise<void> {
    // Usa exportToPDF esistente
    const exportData: ExportData = {
      expenses: data.expenses,
      investments: data.investments,
      goals: data.goals,
      summary: data.summary
    };

    exportToPDF(exportData);
  }

  /**
   * Export report come CSV
   */
  private exportReportCSV(data: ReportData): void {
    const exportData: ExportData = {
      expenses: data.expenses,
      investments: data.investments,
      goals: data.goals,
      summary: data.summary
    };

    exportToCSV(exportData);
  }

  /**
   * Identifica punti di forza
   */
  private identifyStrengths(analysis: ComprehensiveAnalysis): string[] {
    const strengths: string[] = [];

    if (analysis.savings.rate >= 20) {
      strengths.push('Tasso di risparmio eccellente (≥20%)');
    }

    if (analysis.investments.diversification.score >= 0.7) {
      strengths.push('Portafoglio ben diversificato');
    }

    if (analysis.investments.performance.totalReturn > 0) {
      strengths.push('Portafoglio in rendimento positivo');
    }

    return strengths.length > 0 ? strengths : ['Continua a tracciare le tue finanze per identificare i punti di forza'];
  }

  /**
   * Identifica aree di miglioramento
   */
  private identifyImprovements(
    analysis: ComprehensiveAnalysis,
    insights: InsightResult
  ): Array<{
    category: string;
    description: string;
    actions: Array<{
      description: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
    }>;
    expectedImprovement: string;
    suggestedTimeline: string;
  }> {
    return insights.recommendations.map(rec => ({
      category: rec.category,
      description: rec.description,
      actions: [{
        description: rec.action,
        priority: rec.priority,
        impact: this.estimateImpact(rec, analysis)
      }],
      expectedImprovement: this.calculateExpectedOutcome(rec, analysis),
      suggestedTimeline: this.estimateTimeline(rec.priority)
    }));
  }

  /**
   * Genera confronto con peer
   */
  private generatePeerComparison(score: number): {
    percentile: number;
    description: string;
  } {
    // Placeholder - in futuro si useranno dati reali di benchmark
    let percentile = 50;
    let description = 'Nella media';

    if (score >= 90) {
      percentile = 95;
      description = 'Eccellente - nel top 5%';
    } else if (score >= 80) {
      percentile = 85;
      description = 'Molto buono - nel top 15%';
    } else if (score >= 70) {
      percentile = 70;
      description = 'Buono - superiore alla media';
    } else if (score >= 60) {
      percentile = 50;
      description = 'Nella media';
    } else {
      percentile = 30;
      description = 'Sotto la media - c\'è spazio per migliorare';
    }

    return { percentile, description };
  }

  /**
   * Stima impatto di una raccomandazione
   */
  private estimateImpact(rec: ActionableRecommendation, analysis: ComprehensiveAnalysis): string {
    if (rec.category === 'savings') {
      return 'Potenziale aumento del tasso di risparmio del 5-10%';
    } else if (rec.category === 'investments') {
      return 'Miglioramento della diversificazione e riduzione del rischio';
    }
    return 'Miglioramento generale della salute finanziaria';
  }

  /**
   * Calcola outcome atteso
   */
  private calculateExpectedOutcome(rec: ActionableRecommendation, analysis: ComprehensiveAnalysis): string {
    if (rec.category === 'savings') {
      return 'Aumento del tasso di risparmio e maggiore sicurezza finanziaria';
    } else if (rec.category === 'investments') {
      return 'Portafoglio più equilibrato e rischio ridotto';
    }
    return 'Miglioramento complessivo della situazione finanziaria';
  }

  /**
   * Stima timeline per una raccomandazione
   */
  private estimateTimeline(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return '1-2 settimane';
      case 'medium':
        return '1-2 mesi';
      case 'low':
        return '3-6 mesi';
    }
  }

  /**
   * Ottiene contenuti educativi correlati
   */
  private getRelatedEducationalContent(category: string): string[] {
    const content: Record<string, string[]> = {
      savings: [
        'Guida: Come aumentare il tasso di risparmio',
        'Strategie per creare un fondo di emergenza',
        'Budgeting efficace: tecniche avanzate'
      ],
      investments: [
        'Principi di diversificazione del portafoglio',
        'Gestione del rischio negli investimenti',
        'Asset allocation per principianti'
      ],
      spending: [
        'Come identificare e ridurre spese non essenziali',
        'Budgeting intelligente: il metodo 50/30/20',
        'Tracking delle spese: best practices'
      ]
    };

    return content[category] || ['Contenuti educativi generali'];
  }

  /**
   * Genera notice di compliance
   */
  private generateReportComplianceNotice(): ComplianceNotice {
    return {
      educational: true,
      noAdvice: true,
      gdprCompliant: true,
      disclaimer: 'Questo report è a scopo educativo e informativo. Non costituisce consulenza finanziaria. Per decisioni finanziarie importanti, consulta un professionista qualificato. I dati sono processati in conformità al GDPR.'
    };
  }
}

export default AIReportGenerator;

