// Insight Engine - Analisi finanziaria completa con insights avanzati
import { UserBehaviorAnalyzer } from './UserBehaviorAnalyzer';
import { FinancialHealthScorer } from './FinancialHealthScorer';
import { calculatePortfolioMetrics, getAssetAllocation } from '@/lib/investmentMetrics';
import { geminiAI } from '@/lib/geminiAI';
import type { ParsedTransaction } from '@/lib/geminiAI';
import type { Investment } from '@/lib/storage';

// Type definitions
export interface SpendingTrend {
  category: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  change: number; // percentuale
  period: string;
}

export interface SpendingAnomaly {
  type: 'unusual_amount' | 'unusual_frequency' | 'unusual_category';
  description: string;
  amount: number;
  date: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RecurringExpense {
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  nextDue?: string;
}

export interface SavingsProgress {
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  progress: number; // percentuale
  timeframe: string;
}

export interface PortfolioPerformance {
  totalReturn: number; // percentuale
  totalValue: number;
  totalCost: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
}

export interface DiversificationScore {
  score: number; // 0-1, più alto = meglio diversificato
  byType: Record<string, number>; // percentuali
  byAsset: Record<string, number>; // percentuali
  recommendations: string[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  score: number; // 0-100
}

export interface InvestmentCosts {
  total: number;
  fees: number;
  taxes: number;
  recommendations: string[];
}

export interface ConsistencyMetrics {
  score: number;
  trackingFrequency: number;
  budgetAdherence: number;
  goalProgress: number;
}

export interface ComprehensiveAnalysis {
  spending: {
    categories: Record<string, number>;
    trends: SpendingTrend[];
    anomalies: SpendingAnomaly[];
    recurring: RecurringExpense[];
  };
  savings: {
    rate: number;
    progress: SavingsProgress[];
    efficiency: number;
  };
  investments: {
    performance: PortfolioPerformance;
    diversification: DiversificationScore;
    risk: RiskAssessment;
    costs: InvestmentCosts;
  };
  behavioral: {
    consistency: ConsistencyMetrics;
    habits: Array<{
      habit: string;
      frequency: number;
      impact: 'positive' | 'negative' | 'neutral';
      suggestion?: string;
    }>;
    opportunities: Array<{
      area: string;
      potential: number;
      difficulty: 'easy' | 'medium' | 'hard';
      timeframe: string;
      description: string;
    }>;
  };
}

export interface SpendingInsight {
  type: 'warning' | 'tip' | 'success' | 'info';
  title: string;
  description: string;
  category?: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface SavingOpportunity {
  area: string;
  potential: number; // EUR
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InvestmentInsight {
  type: 'performance' | 'diversification' | 'risk' | 'cost';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RiskAlert {
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: 'spending' | 'savings' | 'investments' | 'debt';
  action?: string;
}

export interface ActionableRecommendation {
  type: 'savings_opportunity' | 'diversification_educational' | 'spending_optimization' | 'investment_education';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'savings' | 'spending' | 'investments' | 'education';
}

export interface InsightResult {
  financialHealth: ReturnType<FinancialHealthScorer['calculateScore']>;
  spendingInsights: SpendingInsight[];
  savingOpportunities: SavingOpportunity[];
  investmentInsights: InvestmentInsight[];
  riskAlerts: RiskAlert[];
  recommendations: ActionableRecommendation[];
}

export class InsightEngine {
  private behaviorAnalyzer: UserBehaviorAnalyzer;
  private healthScorer: FinancialHealthScorer;

  constructor() {
    this.behaviorAnalyzer = new UserBehaviorAnalyzer();
    this.healthScorer = new FinancialHealthScorer();
  }

  /**
   * Genera insights completi basati sui dati utente
   */
  async generateInsights(userData: {
    expenses?: any[];
    investments?: any[];
    goals?: any[];
    scope?: 'dashboard' | 'detailed';
  }): Promise<InsightResult> {
    console.log('[InsightEngine] Generating comprehensive insights');

    // Esegue analisi completa
    const analysis = await this.comprehensiveAnalysis(userData);
    
    return {
      financialHealth: this.healthScorer.calculateScore(analysis),
      spendingInsights: this.analyzeSpendingPatterns(analysis),
      savingOpportunities: this.identifySavingOpportunities(analysis),
      investmentInsights: this.analyzeInvestments(analysis),
      riskAlerts: this.identifyRisks(analysis),
      recommendations: this.generateActionableRecommendations(analysis)
    };
  }

  /**
   * Analisi completa di tutti i dati finanziari
   */
  private async comprehensiveAnalysis(userData: {
    expenses?: any[];
    investments?: any[];
    goals?: any[];
  }): Promise<ComprehensiveAnalysis> {
    const expenses = userData.expenses || [];
    const investments = userData.investments || [];
    const goals = userData.goals || [];

    // Analisi spese
    const spending = {
      categories: this.categorizeSpending(expenses),
      trends: this.analyzeSpendingTrends(expenses),
      anomalies: this.detectSpendingAnomalies(expenses),
      recurring: this.identifyRecurringExpenses(expenses)
    };

    // Analisi risparmi
    const totalIncome = expenses
      .filter(e => e.type === 'Income')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses
      .filter(e => e.type === 'Expense')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const savings = {
      rate: this.calculateSavingsRate(totalIncome, totalExpenses),
      progress: this.analyzeSavingsProgress(goals),
      efficiency: this.analyzeSavingsEfficiency(totalIncome, totalExpenses, investments)
    };

    // Analisi investimenti
    const investments_analysis = {
      performance: this.analyzePortfolioPerformance(investments),
      diversification: this.analyzeDiversification(investments),
      risk: this.assessPortfolioRisk(investments),
      costs: this.analyzeInvestmentCosts(investments)
    };

    // Analisi comportamentale
    const behavioral = {
      consistency: this.analyzeFinancialConsistency(userData),
      habits: this.identifyFinancialHabits(userData),
      opportunities: this.identifyImprovementOpportunities(userData)
    };

    return {
      spending,
      savings,
      investments: investments_analysis,
      behavioral
    };
  }

  /**
   * Categorizza spese per categoria
   */
  private categorizeSpending(expenses: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    expenses
      .filter(e => e.type === 'Expense')
      .forEach(expense => {
        const category = expense.category || 'Other';
        categories[category] = (categories[category] || 0) + expense.amount;
      });

    return categories;
  }

  /**
   * Analizza trend di spesa
   */
  private analyzeSpendingTrends(expenses: any[]): SpendingTrend[] {
    const trends: SpendingTrend[] = [];
    
    // Raggruppa per categoria e mese
    const monthlyByCategory = new Map<string, Map<string, number>>();
    
    expenses
      .filter(e => e.type === 'Expense')
      .forEach(expense => {
        const category = expense.category || 'Other';
        const month = new Date(expense.date).toISOString().slice(0, 7); // YYYY-MM
        
        if (!monthlyByCategory.has(category)) {
          monthlyByCategory.set(category, new Map());
        }
        
        const monthly = monthlyByCategory.get(category)!;
        monthly.set(month, (monthly.get(month) || 0) + expense.amount);
      });

    // Analizza trend per categoria
    monthlyByCategory.forEach((monthly, category) => {
      const amounts = Array.from(monthly.values());
      if (amounts.length >= 2) {
        const first = amounts[0];
        const last = amounts[amounts.length - 1];
        const change = ((last - first) / first) * 100;
        
        trends.push({
          category,
          direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
          change: Math.abs(change),
          period: `${monthly.size} mesi`
        });
      }
    });

    return trends;
  }

  /**
   * Rileva anomalie di spesa
   */
  private detectSpendingAnomalies(expenses: any[]): SpendingAnomaly[] {
    const anomalies: SpendingAnomaly[] = [];
    const expenseList = expenses.filter(e => e.type === 'Expense');

    if (expenseList.length === 0) return anomalies;

    // Calcola media e deviazione standard
    const amounts = expenseList.map(e => e.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev; // 2 standard deviations

    // Trova spese anomale
    expenseList.forEach(expense => {
      if (expense.amount > threshold) {
        anomalies.push({
          type: 'unusual_amount',
          description: `Spesa insolitamente alta in ${expense.category || 'Unknown'}: €${expense.amount.toFixed(2)}`,
          amount: expense.amount,
          date: expense.date,
          severity: expense.amount > mean + 3 * stdDev ? 'high' : 'medium'
        });
      }
    });

    return anomalies.slice(0, 10); // Limita a top 10
  }

  /**
   * Identifica spese ricorrenti
   */
  private identifyRecurringExpenses(expenses: any[]): RecurringExpense[] {
    const recurring: RecurringExpense[] = [];
    const expenseMap = new Map<string, Array<{ amount: number; date: string }>>();

    expenses
      .filter(e => e.type === 'Expense')
      .forEach(expense => {
        const key = `${expense.category}_${expense.description?.toLowerCase()}`;
        if (!expenseMap.has(key)) {
          expenseMap.set(key, []);
        }
        expenseMap.get(key)!.push({
          amount: expense.amount,
          date: expense.date
        });
      });

    // Identifica pattern ricorrenti
    expenseMap.forEach((transactions, key) => {
      if (transactions.length >= 3) {
        const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
        const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
        
        // Calcola frequenza approssimativa
        const daysDiff = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
        const avgDays = daysDiff / (transactions.length - 1);
        
        let frequency: RecurringExpense['frequency'] = 'monthly';
        if (avgDays <= 2) frequency = 'daily';
        else if (avgDays <= 8) frequency = 'weekly';
        else if (avgDays <= 35) frequency = 'monthly';
        else frequency = 'yearly';

        const [category, description] = key.split('_');
        recurring.push({
          description: description || category,
          amount: avgAmount,
          frequency,
          category,
          nextDue: dates[dates.length - 1].toISOString().split('T')[0]
        });
      }
    });

    return recurring.slice(0, 10); // Top 10 ricorrenti
  }

  /**
   * Calcola tasso di risparmio
   */
  private calculateSavingsRate(income: number, expenses: number): number {
    if (income <= 0) return 0;
    return ((income - expenses) / income) * 100;
  }

  /**
   * Analizza progresso obiettivi di risparmio
   */
  private analyzeSavingsProgress(goals: any[]): SavingsProgress[] {
    return goals
      .filter(g => g.type === 'Savings' || g.targetAmount)
      .map(goal => ({
        goalId: goal.id || goal.name,
        goalName: goal.name || 'Obiettivo',
        currentAmount: goal.currentAmount || 0,
        targetAmount: goal.targetAmount || 1,
        progress: goal.targetAmount > 0 
          ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 
          : 0,
        timeframe: goal.timeframe || goal.deadline || 'N/A'
      }));
  }

  /**
   * Analizza efficienza risparmio
   */
  private analyzeSavingsEfficiency(
    income: number,
    expenses: number,
    investments: any[]
  ): number {
    if (income <= 0) return 0;
    
    const savingsAmount = income - expenses;
    const investmentValue = investments.reduce(
      (sum, inv) => sum + (inv.currentPrice * inv.quantity),
      0
    );

    // Score basato su rapporto risparmi/investimenti e tasso di risparmio
    const savingsRate = (savingsAmount / income) * 100;
    const investmentRatio = income > 0 ? (investmentValue / income) : 0;
    
    return Math.min(100, (savingsRate * 0.6 + Math.min(investmentRatio * 100, 40)));
  }

  /**
   * Analizza performance portafoglio
   */
  private analyzePortfolioPerformance(investments: any[]): PortfolioPerformance {
    if (investments.length === 0) {
      return {
        totalReturn: 0,
        totalValue: 0,
        totalCost: 0,
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0
      };
    }

    const metrics = calculatePortfolioMetrics(investments as Investment[]);
    
    return {
      totalReturn: metrics.totalGainLossPercent,
      totalValue: metrics.totalValue,
      totalCost: metrics.totalValue - metrics.totalGainLoss,
      annualizedReturn: metrics.annualizedReturn,
      volatility: metrics.volatility,
      sharpeRatio: metrics.sharpeRatio
    };
  }

  /**
   * Analizza diversificazione portafoglio
   */
  private analyzeDiversification(investments: any[]): DiversificationScore {
    if (investments.length === 0) {
      return {
        score: 0,
        byType: {},
        byAsset: {},
        recommendations: ['Inizia a diversificare il portafoglio']
      };
    }

    const allocation = getAssetAllocation(investments as Investment[]);
    const metrics = calculatePortfolioMetrics(investments as Investment[]);
    
    const byType: Record<string, number> = {};
    const byAsset: Record<string, number> = {};
    
    allocation.forEach(asset => {
      byType[asset.type] = (byType[asset.type] || 0) + asset.percentage;
      byAsset[asset.name] = (byAsset[asset.name] || 0) + asset.percentage;
    });

    // Score basato su HHI (Herfindahl-Hirschman Index)
    // HHI più basso = diversificazione migliore
    const hhi = metrics.diversification.herfindahlIndex;
    const score = Math.max(0, 1 - hhi); // Inverti: più basso HHI = score più alto

    const recommendations: string[] = [];
    if (score < 0.7) {
      recommendations.push('Considera di diversificare in più asset class');
    }
    if (Object.keys(byType).length < 3) {
      recommendations.push('Aggiungi più tipologie di investimenti (azioni, obbligazioni, ETF, crypto)');
    }

    return {
      score,
      byType,
      byAsset,
      recommendations
    };
  }

  /**
   * Valuta rischio portafoglio
   */
  private assessPortfolioRisk(investments: any[]): RiskAssessment {
    if (investments.length === 0) {
      return {
        level: 'low',
        factors: [],
        score: 0
      };
    }

    const metrics = calculatePortfolioMetrics(investments as Investment[]);
    const factors: string[] = [];
    let riskScore = 0;

    // Volatilità
    if (metrics.volatility > 30) {
      factors.push('Alta volatilità del portafoglio');
      riskScore += 30;
    } else if (metrics.volatility > 20) {
      factors.push('Volatilità moderata');
      riskScore += 15;
    }

    // Concentrazione
    if (metrics.diversification.herfindahlIndex > 0.5) {
      factors.push('Portafoglio concentrato in poche asset');
      riskScore += 25;
    }

    // Performance negativa
    if (metrics.totalGainLossPercent < -10) {
      factors.push('Perdite significative recenti');
      riskScore += 20;
    }

    // Numero di asset
    if (investments.length < 3) {
      factors.push('Portafoglio con pochi asset (maggiore rischio)');
      riskScore += 15;
    }

    const level = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

    return {
      level,
      factors,
      score: Math.min(100, riskScore)
    };
  }

  /**
   * Analizza costi investimenti
   */
  private analyzeInvestmentCosts(investments: any[]): InvestmentCosts {
    // Placeholder: in futuro si calcoleranno commissioni reali
    const total = investments.reduce(
      (sum, inv) => sum + (inv.currentPrice * inv.quantity),
      0
    );

    // Stima costi (0.5% per transazioni, 0.2% per gestione)
    const fees = total * 0.002;
    const taxes = 0; // Calcolato al momento della vendita

    const recommendations: string[] = [];
    if (fees > total * 0.01) {
      recommendations.push('Considera broker con commissioni più basse');
    }

    return {
      total,
      fees,
      taxes,
      recommendations
    };
  }

  /**
   * Analizza consistenza finanziaria (delega a behaviorAnalyzer)
   */
  private analyzeFinancialConsistency(userData: {
    expenses?: any[];
    goals?: any[];
    investments?: any[];
  }): ConsistencyMetrics {
    const result = this.behaviorAnalyzer.analyzeFinancialConsistency(userData);
    return {
      score: result.score,
      trackingFrequency: result.metrics.trackingFrequency,
      budgetAdherence: result.metrics.budgetAdherence,
      goalProgress: result.metrics.goalProgress
    };
  }

  /**
   * Identifica abitudini finanziarie (delega a behaviorAnalyzer)
   */
  private identifyFinancialHabits(userData: {
    expenses?: any[];
    investments?: any[];
  }) {
    return this.behaviorAnalyzer.identifyFinancialHabits(userData);
  }

  /**
   * Identifica opportunità di miglioramento (delega a behaviorAnalyzer)
   */
  private identifyImprovementOpportunities(userData: {
    expenses?: any[];
    goals?: any[];
    investments?: any[];
  }) {
    return this.behaviorAnalyzer.identifyImprovementOpportunities(userData);
  }

  /**
   * Analizza pattern di spesa e genera insights
   */
  private analyzeSpendingPatterns(analysis: ComprehensiveAnalysis): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // Insight su categorie principali
    const categories = Object.entries(analysis.spending.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (categories.length > 0) {
      const [topCategory, topAmount] = categories[0];
      const totalSpending = Object.values(analysis.spending.categories)
        .reduce((sum, amt) => sum + amt, 0);
      const percentage = (topAmount / totalSpending) * 100;

      if (percentage > 40) {
        insights.push({
          type: 'warning',
          title: `Concentrazione di spese in ${topCategory}`,
          description: `Il ${percentage.toFixed(1)}% delle tue spese va in ${topCategory}. Considera di diversificare.`,
          category: topCategory,
          impact: 'medium',
          actionable: true
        });
      }
    }

    // Insight su trend
    analysis.spending.trends.forEach(trend => {
      if (trend.direction === 'increasing' && trend.change > 10) {
        insights.push({
          type: 'warning',
          title: `Trend crescente in ${trend.category}`,
          description: `Le spese in ${trend.category} sono aumentate del ${trend.change.toFixed(1)}%`,
          category: trend.category,
          impact: 'medium',
          actionable: true
        });
      }
    });

    // Insight su anomalie
    const highSeverityAnomalies = analysis.spending.anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Spese anomale rilevate',
        description: `${highSeverityAnomalies.length} spesa/e insolitamente alta/e trovata/e`,
        impact: 'high',
        actionable: true
      });
    }

    return insights;
  }

  /**
   * Identifica opportunità di risparmio
   */
  private identifySavingOpportunities(analysis: ComprehensiveAnalysis): SavingOpportunity[] {
    const opportunities = analysis.behavioral.opportunities.map(opp => ({
      ...opp,
      priority: opp.potential > 100 ? 'high' as const 
        : opp.potential > 50 ? 'medium' as const 
        : 'low' as const
    }));

    // Aggiungi opportunità basata su tasso di risparmio
    if (analysis.savings.rate < 20) {
      const income = Object.values(analysis.spending.categories)
        .reduce((sum, amt) => sum + amt, 0) / (1 - analysis.savings.rate / 100);
      const potential = income * 0.2 - (income - Object.values(analysis.spending.categories)
        .reduce((sum, amt) => sum + amt, 0));

      if (potential > 0) {
        opportunities.push({
          area: 'Tasso di risparmio',
          potential,
          difficulty: 'medium',
          timeframe: '3-6 mesi',
          description: `Aumentando il tasso di risparmio al 20%, potresti risparmiare €${potential.toFixed(2)} al mese`,
          priority: 'high'
        });
      }
    }

    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analizza investimenti e genera insights
   */
  private analyzeInvestments(analysis: ComprehensiveAnalysis): InvestmentInsight[] {
    const insights: InvestmentInsight[] = [];

    const perf = analysis.investments.performance;
    const div = analysis.investments.diversification;
    const risk = analysis.investments.risk;

    // Performance insights
    if (perf.totalReturn > 10) {
      insights.push({
        type: 'performance',
        title: 'Ottime performance del portafoglio',
        description: `Il portafoglio ha generato un rendimento del ${perf.totalReturn.toFixed(2)}%`,
        recommendation: 'Considera di prendere alcuni profitti o reinvestire',
        priority: 'medium'
      });
    } else if (perf.totalReturn < -10) {
      insights.push({
        type: 'performance',
        title: 'Performance negative del portafoglio',
        description: `Il portafoglio mostra una perdita del ${Math.abs(perf.totalReturn).toFixed(2)}%`,
        recommendation: 'Valuta se questo rientra nella tua strategia a lungo termine',
        priority: 'high'
      });
    }

    // Diversification insights
    if (div.score < 0.7) {
      insights.push({
        type: 'diversification',
        title: 'Portafoglio poco diversificato',
        description: div.recommendations.join(' '),
        recommendation: 'Considera di aggiungere nuove asset class per ridurre il rischio',
        priority: 'high'
      });
    }

    // Risk insights
    if (risk.level === 'high') {
      insights.push({
        type: 'risk',
        title: 'Rischio elevato nel portafoglio',
        description: `Fattori di rischio: ${risk.factors.join(', ')}`,
        recommendation: 'Considera di ridurre l\'esposizione al rischio diversificando maggiormente',
        priority: 'high'
      });
    }

    return insights;
  }

  /**
   * Identifica rischi finanziari
   */
  private identifyRisks(analysis: ComprehensiveAnalysis): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    // Rischi di spesa
    if (analysis.savings.rate < 10) {
      alerts.push({
        level: 'high',
        title: 'Tasso di risparmio molto basso',
        description: `Il tuo tasso di risparmio è del ${analysis.savings.rate.toFixed(1)}%, sotto la raccomandazione del 20%`,
        category: 'savings',
        action: 'Analizza le spese per identificare aree di ottimizzazione'
      });
    }

    // Rischi di investimento
    if (analysis.investments.risk.level === 'high') {
      alerts.push({
        level: 'high',
        title: 'Rischio elevato nel portafoglio',
        description: analysis.investments.risk.factors.join('. '),
        category: 'investments',
        action: 'Valuta di diversificare il portafoglio per ridurre il rischio'
      });
    }

    // Rischi di concentrazione spese
    const categories = Object.entries(analysis.spending.categories)
      .sort(([, a], [, b]) => b - a);
    if (categories.length > 0) {
      const [topCategory, topAmount] = categories[0];
      const total = Object.values(analysis.spending.categories).reduce((sum, amt) => sum + amt, 0);
      if (topAmount / total > 0.5) {
        alerts.push({
          level: 'medium',
          title: 'Concentrazione elevata di spese',
          description: `Il 50%+ delle spese va in ${topCategory}`,
          category: 'spending',
          action: 'Diversifica le tue spese per ridurre la dipendenza da una categoria'
        });
      }
    }

    return alerts;
  }

  /**
   * Genera raccomandazioni azionabili
   */
  private generateActionableRecommendations(analysis: ComprehensiveAnalysis): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];

    // Raccomandazioni basate su risparmio
    if (analysis.savings.rate < 0.2) {
      recommendations.push({
        type: 'savings_opportunity',
        title: 'Potenziale aumento risparmi',
        description: 'Il tuo tasso di risparmio è inferiore alla media raccomandata del 20%',
        action: 'Analizza le spese discrezionali per identificare opportunità di risparmio',
        priority: 'high',
        category: 'savings'
      });
    }

    // Raccomandazioni basate su diversificazione
    if (analysis.investments.diversification.score < 0.7) {
      recommendations.push({
        type: 'diversification_educational',
        title: 'Opportunità di apprendimento sulla diversificazione',
        description: 'Il portafoglio mostra concentrazione in poche asset class',
        action: 'Studia i principi di diversificazione per comprendere come distribuire il rischio',
        priority: 'medium',
        category: 'education'
      });
    }

    // Raccomandazioni basate su spese
    const topSpendingCategory = Object.entries(analysis.spending.categories)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topSpendingCategory) {
      const [category, amount] = topSpendingCategory;
      const total = Object.values(analysis.spending.categories).reduce((sum, amt) => sum + amt, 0);
      
      if (amount / total > 0.4 && ['Entertainment', 'Shopping'].includes(category)) {
        recommendations.push({
          type: 'spending_optimization',
          title: `Ottimizzazione spese in ${category}`,
          description: `Le spese in ${category} rappresentano una parte significativa del budget`,
          action: `Valuta se puoi ridurre le spese in ${category} del 10-20% senza impattare la qualità di vita`,
          priority: 'medium',
          category: 'spending'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

export default InsightEngine;

