import { Investment } from './storage';

export interface PortfolioMetrics {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  diversification: {
    byType: Record<string, number>;
    byAsset: Record<string, number>;
    herfindahlIndex: number;
  };
}

export interface AssetAllocation {
  name: string;
  value: number;
  percentage: number;
  type: string;
}

// Calculate annualized return
export function calculateAnnualizedReturn(
  currentValue: number,
  initialValue: number,
  years: number
): number {
  if (years <= 0 || initialValue <= 0) return 0;
  return (Math.pow(currentValue / initialValue, 1 / years) - 1) * 100;
}

// Calculate portfolio volatility (standard deviation of returns)
export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);
  
  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
}

// Calculate Sharpe Ratio (assuming 2% risk-free rate)
export function calculateSharpeRatio(
  annualizedReturn: number,
  volatility: number,
  riskFreeRate: number = 2
): number {
  if (volatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / volatility;
}

// Calculate Herfindahl-Hirschman Index for diversification
// Lower values (closer to 0) indicate better diversification
export function calculateHerfindahlIndex(weights: number[]): number {
  return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
}

// Calculate comprehensive portfolio metrics
export function calculatePortfolioMetrics(investments: Investment[]): PortfolioMetrics {
  const totalValue = investments.reduce(
    (sum, inv) => sum + inv.currentPrice * inv.quantity,
    0
  );
  
  const totalCost = investments.reduce(
    (sum, inv) => sum + inv.purchasePrice * inv.quantity,
    0
  );
  
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Calculate years since purchase (assuming purchase date is available)
  const avgYears = investments.reduce((sum, inv) => {
    const purchaseDate = inv.purchaseDate ? new Date(inv.purchaseDate) : new Date();
    const years = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return sum + years;
  }, 0) / investments.length || 1;

  const annualizedReturn = calculateAnnualizedReturn(totalValue, totalCost, avgYears);

  // Calculate individual asset returns for volatility
  const returns = investments.map(inv => {
    const gain = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
    return gain;
  });
  
  const volatility = calculateVolatility(returns);
  const sharpeRatio = calculateSharpeRatio(annualizedReturn, volatility);

  // Diversification analysis
  const byType: Record<string, number> = {};
  const byAsset: Record<string, number> = {};
  const weights: number[] = [];

  investments.forEach(inv => {
    const value = inv.currentPrice * inv.quantity;
    const weight = value / totalValue;
    weights.push(weight);

    // By type
    byType[inv.type] = (byType[inv.type] || 0) + value;
    
    // By asset
    byAsset[inv.name] = (byAsset[inv.name] || 0) + value;
  });

  const herfindahlIndex = calculateHerfindahlIndex(weights);

  return {
    totalValue,
    totalGainLoss,
    totalGainLossPercent,
    annualizedReturn,
    volatility,
    sharpeRatio,
    diversification: {
      byType,
      byAsset,
      herfindahlIndex,
    },
  };
}

// Identify portfolio imbalances
export function checkPortfolioBalance(
  diversification: Record<string, number>,
  totalValue: number,
  threshold: number = 40
): string[] {
  const alerts: string[] = [];

  Object.entries(diversification).forEach(([key, value]) => {
    const percentage = (value / totalValue) * 100;
    if (percentage > threshold) {
      alerts.push(
        `Portfolio overweight in ${key}: ${percentage.toFixed(1)}% (threshold: ${threshold}%)`
      );
    }
  });

  return alerts;
}

// Simulate future returns with additional monthly contributions
export function simulateFutureReturns(
  currentValue: number,
  monthlyContribution: number,
  expectedReturn: number,
  years: number,
  taxRate: number = 26 // Italian capital gains tax
): {
  projectedValue: number;
  totalContributions: number;
  totalGains: number;
  taxLiability: number;
  netValue: number;
  yearlyBreakdown: Array<{
    year: number;
    value: number;
    contributions: number;
    gains: number;
  }>;
} {
  const monthlyReturn = expectedReturn / 100 / 12;
  const months = years * 12;
  
  let value = currentValue;
  const totalContributions = monthlyContribution * months;
  const yearlyBreakdown = [];

  for (let year = 1; year <= years; year++) {
    let yearStartValue = value;
    
    for (let month = 1; month <= 12; month++) {
      value = value * (1 + monthlyReturn) + monthlyContribution;
    }
    
    yearlyBreakdown.push({
      year,
      value,
      contributions: monthlyContribution * 12,
      gains: value - yearStartValue - (monthlyContribution * 12),
    });
  }

  const projectedValue = value;
  const totalGains = projectedValue - currentValue - totalContributions;
  const taxLiability = totalGains > 0 ? totalGains * (taxRate / 100) : 0;
  const netValue = projectedValue - taxLiability;

  return {
    projectedValue,
    totalContributions,
    totalGains,
    taxLiability,
    netValue,
    yearlyBreakdown,
  };
}

// Calculate asset allocation for charts
export function getAssetAllocation(investments: Investment[]): AssetAllocation[] {
  const totalValue = investments.reduce(
    (sum, inv) => sum + inv.currentPrice * inv.quantity,
    0
  );

  const allocation: Record<string, AssetAllocation> = {};

  investments.forEach(inv => {
    const value = inv.currentPrice * inv.quantity;
    
    if (allocation[inv.name]) {
      allocation[inv.name].value += value;
    } else {
      allocation[inv.name] = {
        name: inv.name,
        value,
        percentage: 0,
        type: inv.type,
      };
    }
  });

  return Object.values(allocation).map(item => ({
    ...item,
    percentage: (item.value / totalValue) * 100,
  }));
}
