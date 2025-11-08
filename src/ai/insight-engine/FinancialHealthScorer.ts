// Financial Health Scorer - Calcola score di salute finanziaria
import type { ComprehensiveAnalysis } from './InsightEngine';

export interface FinancialHealthScore {
  overall: number; // 0-100
  breakdown: {
    savings: number;
    spending: number;
    investments: number;
    debt: number;
    emergency: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    change: number;
  };
  insights: string[];
}

export class FinancialHealthScorer {
  /**
   * Calcola il punteggio complessivo di salute finanziaria
   */
  calculateScore(analysis: ComprehensiveAnalysis): FinancialHealthScore {
    const breakdown = {
      savings: this.scoreSavings(analysis.savings),
      spending: this.scoreSpending(analysis.spending),
      investments: this.scoreInvestments(analysis.investments),
      debt: this.scoreDebt(analysis), // Placeholder per analisi debiti futura
      emergency: this.scoreEmergencyFund(analysis.savings) // Placeholder
    };

    const overall = (
      breakdown.savings * 0.25 +
      breakdown.spending * 0.25 +
      breakdown.investments * 0.20 +
      breakdown.debt * 0.15 +
      breakdown.emergency * 0.15
    );

    const grade = this.getGrade(overall);
    const trends = this.calculateTrends(analysis);
    const insights = this.generateInsights(overall, breakdown);

    return {
      overall: Math.round(overall),
      breakdown,
      grade,
      trends,
      insights
    };
  }

  private scoreSavings(savings: ComprehensiveAnalysis['savings']): number {
    // Score basato su tasso di risparmio (target: 20%)
    const rateScore = Math.min(100, (savings.rate / 20) * 100);
    
    // Score basato su efficienza risparmio
    const efficiencyScore = savings.efficiency;
    
    // Score basato su progresso obiettivi
    const progressScore = savings.progress.length > 0
      ? savings.progress.reduce((sum, p) => sum + (p.progress || 0), 0) / savings.progress.length
      : 50;

    return (rateScore * 0.5 + efficiencyScore * 0.3 + progressScore * 0.2);
  }

  private scoreSpending(spending: ComprehensiveAnalysis['spending']): number {
    // Score basato su categorizzazione (buona distribuzione = score alto)
    const categories = Object.keys(spending.categories);
    const categoryScore = categories.length >= 5 ? 100 : categories.length * 20;
    
    // Score basato su anomalie (meno anomalie = score alto)
    const anomalyScore = spending.anomalies.length === 0 
      ? 100 
      : Math.max(0, 100 - (spending.anomalies.length * 10));
    
    // Score basato su trend (trend stabile o decrescente = score alto)
    const trendScore = spending.trends.length > 0
      ? spending.trends.reduce((sum, t) => {
          if (t.direction === 'stable' || t.direction === 'decreasing') return sum + 100;
          return sum + 50;
        }, 0) / spending.trends.length
      : 70;

    return (categoryScore * 0.3 + anomalyScore * 0.3 + trendScore * 0.4);
  }

  private scoreInvestments(investments: ComprehensiveAnalysis['investments']): number {
    // Score basato su performance
    const performanceScore = investments.performance.totalReturn >= 0 
      ? Math.min(100, 50 + (investments.performance.totalReturn / 10))
      : Math.max(0, 50 + (investments.performance.totalReturn / 10));
    
    // Score basato su diversificazione (HHI basso = diversificazione alta = score alto)
    const diversificationScore = investments.diversification.score >= 0.7 
      ? 100 
      : investments.diversification.score * 100;
    
    // Score basato su rischio (rischio controllato = score alto)
    const riskScore = investments.risk.level === 'low' 
      ? 100 
      : investments.risk.level === 'medium' 
      ? 70 
      : 40;

    return (performanceScore * 0.4 + diversificationScore * 0.35 + riskScore * 0.25);
  }

  private scoreDebt(analysis: ComprehensiveAnalysis): number {
    // Placeholder: in futuro si analizzeranno debiti reali
    // Per ora assume score buono se non ci sono debiti evidenti
    return 80; // Default score
  }

  private scoreEmergencyFund(savings: ComprehensiveAnalysis['savings']): number {
    // Placeholder: in futuro si analizzerà fondo di emergenza
    // Per ora assume score medio
    return savings.rate > 20 ? 90 : savings.rate > 10 ? 70 : 50;
  }

  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private calculateTrends(analysis: ComprehensiveAnalysis): {
    direction: 'improving' | 'stable' | 'declining';
    change: number;
  } {
    // Analizza trend dai dati (semplificato)
    const savingsTrend = analysis.savings.rate > 20 ? 1 : analysis.savings.rate > 10 ? 0 : -1;
    const spendingTrend = analysis.spending.trends.length > 0
      ? analysis.spending.trends[0].direction === 'decreasing' ? 1 
        : analysis.spending.trends[0].direction === 'increasing' ? -1 : 0
      : 0;
    
    const overallTrend = savingsTrend + spendingTrend;
    
    return {
      direction: overallTrend > 0 ? 'improving' : overallTrend < 0 ? 'declining' : 'stable',
      change: overallTrend * 10 // Stima percentuale di cambio
    };
  }

  private generateInsights(
    overall: number,
    breakdown: FinancialHealthScore['breakdown']
  ): string[] {
    const insights: string[] = [];

    if (overall >= 80) {
      insights.push('Ottima salute finanziaria! Continua così.');
    } else if (overall >= 70) {
      insights.push('Buona salute finanziaria con margini di miglioramento.');
    } else {
      insights.push('Ci sono opportunità per migliorare la tua salute finanziaria.');
    }

    if (breakdown.savings < 70) {
      insights.push('Il tasso di risparmio potrebbe essere migliorato.');
    }

    if (breakdown.spending < 70) {
      insights.push('Controlla meglio le tue spese per identificare aree di ottimizzazione.');
    }

    if (breakdown.investments < 70) {
      insights.push('Considera di diversificare ulteriormente il portafoglio.');
    }

    return insights;
  }
}



