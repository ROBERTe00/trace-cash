import { Card } from "@/components/ui/card";
import { Investment } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import { ModernPieChart } from "@/components/charts/ModernPieChart";
import { aggregateSmallCategories, calculatePortfolioDiversification, assignCategoryColors } from "@/lib/chartUtils";
import { TrendingUp, Shield, Target, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PortfolioAnalysisProps {
  investments: Investment[];
}

export const PortfolioAnalysis = ({ investments }: PortfolioAnalysisProps) => {
  const { formatCurrency } = useApp();

  // Calculate portfolio metrics
  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);

  const categoryData = investments.reduce((acc, inv) => {
    const value = inv.quantity * inv.currentPrice;
    acc[inv.type] = (acc[inv.type] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const rawPieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  // Aggregate small categories
  const aggregatedPieData = aggregateSmallCategories(rawPieData, 0.05);

  // Assign colors
  const colorMap = assignCategoryColors(aggregatedPieData.map(d => d.name));
  const pieData = aggregatedPieData.map(item => ({
    name: item.name,
    value: item.value,
    color: colorMap[item.name],
    percentage: ((item.value / totalValue) * 100).toFixed(1),
  }));

  // Calculate realistic diversification analysis
  const diversificationAnalysis = calculatePortfolioDiversification(categoryData, totalValue);

  // Risk level based on category allocation
  const calculateRiskLevel = () => {
    const cryptoPercentage = ((categoryData["Crypto"] || 0) / totalValue) * 100;
    const stockPercentage = ((categoryData["Stocks"] || 0) / totalValue) * 100;

    if (cryptoPercentage > 40) return { level: "High", color: "text-destructive" };
    if (cryptoPercentage > 20 || stockPercentage > 60) return { level: "Medium", color: "text-warning" };
    return { level: "Low", color: "text-success" };
  };

  // Calculate total yield
  const totalYield = investments.reduce((sum, inv) => {
    const initial = inv.quantity * inv.purchasePrice;
    const current = inv.quantity * inv.currentPrice;
    return sum + current - initial;
  }, 0);

  const yieldPercentage = investments.reduce((sum, inv) => {
    const initial = inv.quantity * inv.purchasePrice;
    const current = inv.quantity * inv.currentPrice;
    return sum + ((current - initial) / initial) * 100;
  }, 0) / Math.max(investments.length, 1);

  const riskLevel = calculateRiskLevel();

  const { t } = useApp();

  if (investments.length === 0) {
    return (
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t('portfolio.analysis')}
        </h3>
        <p className="text-muted-foreground text-center py-8">
          {t('portfolio.addInvestments')}
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 animate-fade-in hover-lift border border-primary/10">
      <h3 className="text-card-title mb-6 flex items-center gap-2">
        <div className="p-2 rounded-xl bg-primary/10">
          <Target className="icon-card text-primary" />
        </div>
        <span>{t('portfolio.analysis')}</span>
      </h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Modern Pie Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">{t('portfolio.assetAllocation')}</h4>
          <ModernPieChart
            data={pieData}
            showPercentages={true}
            height={280}
          />
          
          {/* Category List */}
          <div className="space-y-2 mt-4">
            {pieData.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-primary">{item.percentage}%</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {/* Diversification Score */}
          <div className={`p-4 rounded-lg border ${
            diversificationAnalysis.rating === 'excellent' 
              ? 'bg-success/5 border-success/20' 
              : diversificationAnalysis.rating === 'good'
              ? 'bg-primary/5 border-primary/20'
              : diversificationAnalysis.rating === 'fair'
              ? 'bg-warning/5 border-warning/20'
              : 'bg-destructive/5 border-destructive/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Shield className={`icon-button ${
                  diversificationAnalysis.rating === 'excellent' 
                    ? 'text-success' 
                    : diversificationAnalysis.rating === 'good'
                    ? 'text-primary'
                    : diversificationAnalysis.rating === 'fair'
                    ? 'text-warning'
                    : 'text-destructive'
                }`} />
                {t('portfolio.diversification')}
              </span>
              <span className={`text-medium-number font-bold ${
                diversificationAnalysis.rating === 'excellent' 
                  ? 'text-success' 
                  : diversificationAnalysis.rating === 'good'
                  ? 'text-primary'
                  : diversificationAnalysis.rating === 'fair'
                  ? 'text-warning'
                  : 'text-destructive'
              }`}>
                {diversificationAnalysis.score}/100
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  diversificationAnalysis.rating === 'excellent' 
                    ? 'bg-success' 
                    : diversificationAnalysis.rating === 'good'
                    ? 'bg-primary'
                    : diversificationAnalysis.rating === 'fair'
                    ? 'bg-warning'
                    : 'bg-destructive'
                }`}
                style={{ width: `${diversificationAnalysis.score}%` }}
              />
            </div>
            <p className="text-xs font-medium mb-2">
              {diversificationAnalysis.advice}
            </p>
            {diversificationAnalysis.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {diversificationAnalysis.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-warning" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Level */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('portfolio.riskLevel')}</span>
              <span className={`text-small-number font-bold ${riskLevel.color}`}>{riskLevel.level}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('portfolio.riskBased')}
            </p>
          </div>

          {/* Total Yield */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="icon-button text-primary" />
                {t('portfolio.totalYield')}
              </span>
              <span className={`text-small-number font-bold ${totalYield >= 0 ? "text-success" : "text-destructive"}`}>
                {totalYield >= 0 ? "+" : ""}
                {formatCurrency(totalYield)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {yieldPercentage >= 0 ? "+" : ""}
              {yieldPercentage.toFixed(2)}% {t('portfolio.avgReturn')}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
