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
 * Calculates portfolio diversification score using Shannon Entropy
 * @param data Array of investment values
 * @returns Diversification score from 0-100 (100 = perfectly diversified)
 */
export const calculateDiversificationScore = (
  data: Array<{ value: number }>
): number => {
  if (data.length === 0) return 0;
  if (data.length === 1) return 20; // Single asset = poor diversification

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) return 0;

  // Calculate Shannon Entropy
  const entropy = data.reduce((sum, item) => {
    const p = item.value / total;
    if (p === 0) return sum;
    return sum - p * Math.log2(p);
  }, 0);

  // Normalize to 0-100 scale
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
