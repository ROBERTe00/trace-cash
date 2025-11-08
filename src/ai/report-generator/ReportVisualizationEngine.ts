// Report Visualization Engine - Genera visualizzazioni per i report
import type { ComprehensiveAnalysis } from '@/ai/insight-engine/InsightEngine';
import type { ProcessedReportData } from './ReportDataProcessor';

export interface ReportVisualization {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  description?: string;
  chartConfig: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
  };
  data: any;
}

export class ReportVisualizationEngine {
  /**
   * Crea tutte le visualizzazioni per il report
   */
  async createReportVisualizations(
    analysis: ComprehensiveAnalysis,
    processedData?: ProcessedReportData
  ): Promise<ReportVisualization[]> {
    const visualizations: ReportVisualization[] = [];

    // 1. Spending by Category (Pie Chart)
    if (Object.keys(analysis.spending.categories).length > 0) {
      visualizations.push(this.createSpendingCategoryChart(analysis.spending.categories));
    }

    // 2. Spending Trends (Line Chart)
    if (processedData?.spendingTrends && processedData.spendingTrends.length > 1) {
      visualizations.push(this.createSpendingTrendChart(processedData.spendingTrends));
    }

    // 3. Savings Rate Over Time (Area Chart)
    if (processedData?.spendingTrends) {
      visualizations.push(this.createSavingsRateChart(processedData));
    }

    // 4. Portfolio Allocation (Pie Chart)
    if (analysis.investments.diversification.byType && Object.keys(analysis.investments.diversification.byType).length > 0) {
      visualizations.push(this.createPortfolioAllocationChart(analysis.investments.diversification));
    }

    // 5. Financial Health Score Breakdown (Bar Chart)
    if (processedData) {
      visualizations.push(this.createHealthScoreChart(analysis));
    }

    return visualizations;
  }

  /**
   * Crea grafico spese per categoria (Pie)
   */
  private createSpendingCategoryChart(categories: Record<string, number>): ReportVisualization {
    const sorted = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 categorie

    const colors = [
      '#7B2FF7', '#00D4AA', '#FF6B35', '#FFD166', '#118AB2',
      '#06D6A0', '#EF476F', '#F77F00', '#FCBF49', '#8ECAE6'
    ];

    return {
      id: 'spending-categories',
      type: 'pie',
      title: 'Distribuzione Spese per Categoria',
      description: 'Breakdown delle spese per categoria principale',
      chartConfig: {
        labels: sorted.map(([cat]) => cat),
        datasets: [{
          label: 'Spese',
          data: sorted.map(([, amount]) => amount),
          backgroundColor: colors.slice(0, sorted.length)
        }]
      },
      data: categories
    };
  }

  /**
   * Crea grafico trend di spesa (Line)
   */
  private createSpendingTrendChart(trends: Array<{
    month: string;
    total: number;
    categories: Record<string, number>;
  }>): ReportVisualization {
    return {
      id: 'spending-trends',
      type: 'line',
      title: 'Trend di Spesa Mensile',
      description: 'Evoluzione delle spese nel tempo',
      chartConfig: {
        labels: trends.map(t => {
          const [year, month] = t.month.split('-');
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
          label: 'Spese Totali',
          data: trends.map(t => t.total),
          borderColor: '#7B2FF7',
          backgroundColor: 'rgba(123, 47, 247, 0.1)'
        } as any]
      },
      data: trends
    };
  }

  /**
   * Crea grafico tasso di risparmio (Area)
   */
  private createSavingsRateChart(processedData: ProcessedReportData): ReportVisualization {
    // Calcola savings rate per mese
    const monthlyRates = processedData.spendingTrends.map(trend => {
      const monthIncome = processedData.summary.totalIncome / Math.max(processedData.spendingTrends.length, 1);
      const rate = monthIncome > 0 ? ((monthIncome - trend.total) / monthIncome) * 100 : 0;
      return { month: trend.month, rate };
    });

    return {
      id: 'savings-rate',
      type: 'area',
      title: 'Tasso di Risparmio Mensile',
      description: 'Percentuale di risparmio mese per mese',
      chartConfig: {
        labels: monthlyRates.map(r => {
          const [year, month] = r.month.split('-');
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('it-IT', { month: 'short' });
        }),
        datasets: [{
          label: 'Tasso di Risparmio %',
          data: monthlyRates.map(r => r.rate),
          borderColor: '#00D4AA',
          backgroundColor: 'rgba(0, 212, 170, 0.2)'
        } as any]
      },
      data: monthlyRates
    };
  }

  /**
   * Crea grafico allocazione portafoglio (Pie)
   */
  private createPortfolioAllocationChart(diversification: {
    byType: Record<string, number>;
    byAsset: Record<string, number>;
  }): ReportVisualization {
    const sorted = Object.entries(diversification.byType)
      .sort(([, a], [, b]) => b - a);

    const colors = ['#7B2FF7', '#00D4AA', '#FF6B35', '#FFD166', '#118AB2'];

    return {
      id: 'portfolio-allocation',
      type: 'pie',
      title: 'Allocazione Portafoglio per Tipo',
      description: 'Distribuzione degli investimenti per asset class',
      chartConfig: {
        labels: sorted.map(([type]) => type),
        datasets: [{
          label: 'Valore',
          data: sorted.map(([, value]) => value),
          backgroundColor: colors.slice(0, sorted.length)
        }]
      },
      data: diversification.byType
    };
  }

  /**
   * Crea grafico health score breakdown (Bar)
   */
  private createHealthScoreChart(analysis: ComprehensiveAnalysis): ReportVisualization {
    // Placeholder - in futuro useremo FinancialHealthScorer per ottenere score dettagliati
    const scores = {
      'Spese': analysis.spending ? 75 : 0,
      'Risparmi': analysis.savings ? 70 : 0,
      'Investimenti': analysis.investments ? 65 : 0,
      'Debiti': 80, // Placeholder
      'Emergenza': 70 // Placeholder
    };

    return {
      id: 'health-score',
      type: 'bar',
      title: 'Breakdown Health Score',
      description: 'Punteggio per categoria di salute finanziaria',
      chartConfig: {
        labels: Object.keys(scores),
        datasets: [{
          label: 'Score (0-100)',
          data: Object.values(scores),
          backgroundColor: Object.values(scores).map(score => {
            if (score >= 80) return '#00D4AA';
            if (score >= 60) return '#FFD166';
            return '#FF6B35';
          })
        } as any]
      },
      data: scores
    };
  }

  /**
   * Crea configurazione Chart.js per un grafico
   */
  createChartConfig(visualization: ReportVisualization): any {
    return {
      type: visualization.type,
      data: visualization.chartConfig,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            enabled: true
          }
        }
      }
    };
  }
}



