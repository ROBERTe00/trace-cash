// User Behavior Analyzer - Analizza comportamenti finanziari e pattern
export interface ConsistencyMetrics {
  score: number; // 0-100
  consistency: 'high' | 'medium' | 'low';
  metrics: {
    trackingFrequency: number;
    budgetAdherence: number;
    goalProgress: number;
  };
}

export interface FinancialHabit {
  habit: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  suggestion?: string;
}

export interface ImprovementOpportunity {
  area: string;
  potential: number; // EUR saved/improved
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: string;
  description: string;
}

export class UserBehaviorAnalyzer {
  /**
   * Analizza la consistenza finanziaria dell'utente
   */
  analyzeFinancialConsistency(data: {
    expenses?: any[];
    goals?: any[];
    investments?: any[];
  }): ConsistencyMetrics {
    const expenses = data.expenses || [];
    const goals = data.goals || [];
    
    // Tracking frequency: giorni con transazioni / giorni totali
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trackedDays = new Set(
      expenses
        .filter(e => new Date(e.date) >= last30Days)
        .map(e => e.date)
    ).size;
    const trackingFrequency = Math.min(100, (trackedDays / 30) * 100);

    // Budget adherence: percentuale di spese entro budget (se disponibile)
    // Placeholder: assume 70% se non ci sono dati di budget
    const budgetAdherence = 70; // TODO: calcolare da budget reali se disponibili

    // Goal progress: media del progresso degli obiettivi
    const goalProgress = goals.length > 0
      ? goals.reduce((sum: number, g: any) => {
          const current = g.currentAmount || 0;
          const target = g.targetAmount || 1;
          return sum + (current / target) * 100;
        }, 0) / goals.length
      : 50; // Default 50% se nessun obiettivo

    const overallScore = (trackingFrequency * 0.4 + budgetAdherence * 0.3 + goalProgress * 0.3);
    
    return {
      score: overallScore,
      consistency: overallScore >= 70 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
      metrics: {
        trackingFrequency,
        budgetAdherence,
        goalProgress
      }
    };
  }

  /**
   * Identifica abitudini finanziarie
   */
  identifyFinancialHabits(data: {
    expenses?: any[];
    investments?: any[];
  }): FinancialHabit[] {
    const habits: FinancialHabit[] = [];
    const expenses = data.expenses || [];

    // Analizza pattern di spesa per categoria
    const categoryFrequency = new Map<string, number>();
    const categoryAmounts = new Map<string, number>();
    
    expenses
      .filter(e => e.type === 'Expense')
      .forEach((expense: any) => {
        const category = expense.category || 'Other';
        categoryFrequency.set(category, (categoryFrequency.get(category) || 0) + 1);
        categoryAmounts.set(category, (categoryAmounts.get(category) || 0) + expense.amount);
      });

    // Identifica abitudini positive/negative
    categoryFrequency.forEach((frequency, category) => {
      const totalAmount = categoryAmounts.get(category) || 0;
      const avgAmount = frequency > 0 ? totalAmount / frequency : 0;
      
      if (frequency >= 5) { // Abitudine frequente
        const isEssential = ['Bills & Utilities', 'Healthcare', 'Food & Dining'].includes(category);
        const isHighSpending = avgAmount > 50;
        
        if (isEssential || !isHighSpending) {
          habits.push({
            habit: `Spesa regolare in ${category}`,
            frequency,
            impact: isEssential ? 'neutral' : 'positive',
            suggestion: isEssential ? undefined : 'Continua a monitorare questa categoria'
          });
        } else {
          habits.push({
            habit: `Spesa elevata in ${category}`,
            frequency,
            impact: 'negative',
            suggestion: `Valuta se puoi ridurre le spese in ${category}`
          });
        }
      }
    });

    // Abitudini di risparmio
    const savingsTransactions = expenses.filter(e => 
      e.type === 'Income' && e.amount > 1000
    ).length;

    if (savingsTransactions > 0) {
      habits.push({
        habit: 'Risparmio regolare',
        frequency: savingsTransactions,
        impact: 'positive',
        suggestion: 'Ottima abitudine! Continua a risparmiare regolarmente'
      });
    }

    // Abitudini di investimento
    const investments = data.investments || [];
    if (investments.length > 0) {
      habits.push({
        habit: 'Investimento attivo',
        frequency: investments.length,
        impact: 'positive',
        suggestion: 'Diversifica ulteriormente il portafoglio per ridurre il rischio'
      });
    }

    return habits;
  }

  /**
   * Identifica opportunità di miglioramento
   */
  identifyImprovementOpportunities(data: {
    expenses?: any[];
    goals?: any[];
    investments?: any[];
  }): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = [];
    const expenses = data.expenses || [];

    // Opportunità di risparmio dalle spese
    const expenseByCategory = new Map<string, number>();
    expenses
      .filter(e => e.type === 'Expense')
      .forEach((expense: any) => {
        const category = expense.category || 'Other';
        expenseByCategory.set(category, (expenseByCategory.get(category) || 0) + expense.amount);
      });

    // Identifica categorie con potenziale di risparmio
    const discretionaryCategories = ['Entertainment', 'Shopping', 'Food & Dining'];
    expenseByCategory.forEach((amount, category) => {
      if (discretionaryCategories.includes(category) && amount > 200) {
        const potential = amount * 0.1; // Potenziale 10% di risparmio
        opportunities.push({
          area: category,
          potential,
          difficulty: 'easy',
          timeframe: '1-2 mesi',
          description: `Riducendo le spese in ${category} del 10%, potresti risparmiare €${potential.toFixed(2)} al mese`
        });
      }
    });

    // Opportunità di consolidamento debiti (se presenti)
    // Placeholder per analisi debiti futura
    const totalExpenses = expenses
      .filter(e => e.type === 'Expense')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalIncome = expenses
      .filter(e => e.type === 'Income')
      .reduce((sum, e) => sum + e.amount, 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    if (savingsRate < 20) {
      const potential = totalIncome * 0.2 - (totalIncome - totalExpenses);
      if (potential > 0) {
        opportunities.push({
          area: 'Tasso di risparmio',
          potential,
          difficulty: 'medium',
          timeframe: '3-6 mesi',
          description: `Aumentando il tasso di risparmio al 20%, potresti risparmiare €${potential.toFixed(2)} al mese`
        });
      }
    }

    // Opportunità di diversificazione investimenti
    const investments = data.investments || [];
    if (investments.length > 0 && investments.length < 3) {
      opportunities.push({
        area: 'Diversificazione portafoglio',
        potential: 0, // Non quantificabile in EUR
        difficulty: 'medium',
        timeframe: '1-3 mesi',
        description: 'Diversificando il portafoglio potresti ridurre il rischio complessivo'
      });
    }

    return opportunities.sort((a, b) => b.potential - a.potential);
  }
}

