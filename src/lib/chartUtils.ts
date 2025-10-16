/**
 * Aggregates small categories (below threshold) into an "Others" category
 * @param data Array of category data with name and value
 * @param threshold Minimum percentage to keep as separate category (default 5%)
 * @returns Aggregated data with "Others" category if applicable
 */
export const aggregateSmallCategories = (
  data: Array<{ name: string; value: number }>,
  threshold: number = 0.05
): Array<{ name: string; value: number }> => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) return data;

  const significant = data.filter(item => item.value / total >= threshold);
  const others = data.filter(item => item.value / total < threshold);

  if (others.length > 0) {
    const othersValue = others.reduce((sum, item) => sum + item.value, 0);
    return [...significant, { name: "Others", value: othersValue }];
  }

  return significant;
};

/**
 * Calculates realistic portfolio diversification score based on financial best practices
 * @param categoryData Object with category names and values
 * @param totalValue Total portfolio value
 * @returns Object with score, rating, advice, and warnings
 */
export const calculatePortfolioDiversification = (
  categoryData: Record<string, number>,
  totalValue: number
): {
  score: number;
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  advice: string;
  warnings: string[];
} => {
  if (totalValue === 0 || Object.keys(categoryData).length === 0) {
    return {
      score: 0,
      rating: 'poor',
      advice: 'Add investments to your portfolio to start building wealth',
      warnings: ['No investments in portfolio']
    };
  }

  const warnings: string[] = [];
  let score = 100;

  // Calculate percentages
  const percentages = Object.entries(categoryData).reduce((acc, [cat, value]) => {
    acc[cat] = (value / totalValue) * 100;
    return acc;
  }, {} as Record<string, number>);

  // CRITICAL: Crypto exposure analysis
  const cryptoPercentage = percentages['Crypto'] || 0;
  if (cryptoPercentage > 60) {
    score -= 60;
    warnings.push(`Extremely high crypto exposure (${cryptoPercentage.toFixed(0)}%) - Very high risk`);
  } else if (cryptoPercentage > 40) {
    score -= 40;
    warnings.push(`High crypto exposure (${cryptoPercentage.toFixed(0)}%) - Consider reducing to 20-30%`);
  } else if (cryptoPercentage > 30) {
    score -= 25;
    warnings.push(`Crypto exposure above recommended (${cryptoPercentage.toFixed(0)}%) - Consider reducing to 20%`);
  } else if (cryptoPercentage > 20) {
    score -= 10;
    warnings.push(`Slightly high crypto exposure (${cryptoPercentage.toFixed(0)}%)`);
  }

  // Check for over-concentration in any single category
  Object.entries(percentages).forEach(([category, pct]) => {
    if (category === 'Crypto') return; // Already checked above
    if (pct > 70) {
      score -= 30;
      warnings.push(`Too concentrated in ${category} (${pct.toFixed(0)}%)`);
    } else if (pct > 60) {
      score -= 20;
      warnings.push(`High concentration in ${category} (${pct.toFixed(0)}%)`);
    }
  });

  // Check number of categories (diversity of asset classes)
  const numCategories = Object.keys(categoryData).length;
  if (numCategories === 1) {
    score -= 30;
    warnings.push('Portfolio concentrated in single asset class');
  } else if (numCategories === 2) {
    score -= 10;
  } else if (numCategories >= 4) {
    score += 10; // Bonus for good diversity
  }

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine rating and advice
  let rating: 'poor' | 'fair' | 'good' | 'excellent';
  let advice: string;

  if (score >= 80) {
    rating = 'excellent';
    advice = 'Well-diversified portfolio with balanced risk exposure';
  } else if (score >= 60) {
    rating = 'good';
    advice = 'Good diversification, but some improvements can be made';
  } else if (score >= 40) {
    rating = 'fair';
    advice = 'Moderate diversification - consider rebalancing to reduce concentration';
  } else {
    rating = 'poor';
    advice = 'Poor diversification - high concentration risk, rebalancing recommended';
  }

  return { score, rating, advice, warnings };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use calculatePortfolioDiversification instead
 */
export const calculateDiversificationScore = (
  data: Array<{ value: number }>
): number => {
  if (data.length === 0) return 0;
  if (data.length === 1) return 20;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return 0;

  const entropy = data.reduce((sum, item) => {
    const p = item.value / total;
    if (p === 0) return sum;
    return sum - p * Math.log2(p);
  }, 0);

  const maxEntropy = Math.log2(data.length);
  const normalizedScore = (entropy / maxEntropy) * 100;

  return Math.min(100, Math.round(normalizedScore));
};

/**
 * Formats large numbers with K/M/B suffixes
 * @param num Number to format
 * @returns Formatted string (e.g., "1.2K", "3.5M")
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
};

/**
 * Assigns colors to categories in a consistent, professional palette
 * @param categories Array of category names
 * @returns Map of category names to color strings
 */
export const assignCategoryColors = (categories: string[]): Record<string, string> => {
  const colorPalette = [
    "#10b981", // green-500
    "#3b82f6", // blue-500
    "#8b5cf6", // violet-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#ec4899", // pink-500
    "#64748b", // slate-500
  ];

  const colorMap: Record<string, string> = {};
  categories.forEach((cat, index) => {
    colorMap[cat] = colorPalette[index % colorPalette.length];
  });

  return colorMap;
};
