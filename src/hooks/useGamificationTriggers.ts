import { useEffect } from "react";
import { useGamification } from "./useGamification";
import { useExpenses } from "./useExpenses";
import { useInvestments } from "./useInvestments";

/**
 * Hook to automatically trigger gamification points and achievements
 * based on user actions
 */
export const useGamificationTriggers = () => {
  const { addPoints, unlockAchievement, userLevel } = useGamification();
  const { expenses } = useExpenses();
  const { investments } = useInvestments();

  // Track when user adds their first expense
  useEffect(() => {
    if (expenses.length === 1) {
      unlockAchievement('first_expense');
      addPoints({ points: 10, reason: 'Added first transaction' });
    }
    
    // Milestones for expenses
    if (expenses.length === 10) {
      unlockAchievement('10_transactions');
    }
    if (expenses.length === 50) {
      unlockAchievement('50_transactions');
    }
    if (expenses.length === 100) {
      unlockAchievement('100_transactions');
    }
  }, [expenses.length]);

  // Track when user adds their first investment
  useEffect(() => {
    if (investments.length === 1) {
      unlockAchievement('first_investment');
      addPoints({ points: 20, reason: 'Added first investment' });
    }
    
    // Milestones for investments
    if (investments.length === 5) {
      unlockAchievement('5_investments');
    }
    if (investments.length === 10) {
      unlockAchievement('diversified_portfolio');
    }
  }, [investments.length]);

  // Track portfolio value milestones
  useEffect(() => {
    const totalValue = investments.reduce((sum, inv) => 
      sum + (inv.current_price * inv.quantity), 0
    );

    if (totalValue >= 1000) {
      unlockAchievement('portfolio_1k');
    }
    if (totalValue >= 10000) {
      unlockAchievement('portfolio_10k');
    }
    if (totalValue >= 100000) {
      unlockAchievement('portfolio_100k');
    }
  }, [investments]);

  return {
    triggerTransactionAdded: () => {
      addPoints({ points: 10, reason: 'Added transaction' });
    },
    triggerInvestmentAdded: () => {
      addPoints({ points: 20, reason: 'Added investment' });
    },
    triggerGoalCreated: () => {
      addPoints({ points: 15, reason: 'Created financial goal' });
      unlockAchievement('goal_setter');
    },
    triggerOnboardingComplete: () => {
      addPoints({ points: 50, reason: 'Completed onboarding' });
      unlockAchievement('onboarding_complete');
    },
  };
};
