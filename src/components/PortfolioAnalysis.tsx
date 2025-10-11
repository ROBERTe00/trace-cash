import { Card } from "@/components/ui/card";
import { Investment } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, Shield, Target } from "lucide-react";

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

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / totalValue) * 100).toFixed(1),
  }));

  // Diversification score (0-100)
  const calculateDiversificationScore = () => {
    const categories = Object.keys(categoryData).length;
    const percentages = Object.values(categoryData).map((v) => (v / totalValue) * 100);
    const maxPercentage = Math.max(...percentages);

    // Penalize concentration in one category
    const concentrationPenalty = maxPercentage > 50 ? (maxPercentage - 50) * 0.5 : 0;
    const categoryBonus = categories * 15;

    const score = Math.min(100, categoryBonus - concentrationPenalty);
    return Math.max(0, score);
  };

  // Risk level based on category allocation
  const calculateRiskLevel = () => {
    const cryptoPercentage = ((categoryData["Crypto"] || 0) / totalValue) * 100;
    const stockPercentage = ((categoryData["Stocks"] || 0) / totalValue) * 100;

    if (cryptoPercentage > 40) return { level: "High", color: "text-red-500" };
    if (cryptoPercentage > 20 || stockPercentage > 60) return { level: "Medium", color: "text-yellow-500" };
    return { level: "Low", color: "text-green-500" };
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

  const diversificationScore = calculateDiversificationScore();
  const riskLevel = calculateRiskLevel();

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

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
    <Card className="glass-card p-6 animate-fade-in hover-lift border-2 border-primary/10">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <span className="gradient-text">{t('portfolio.analysis')}</span>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">{t('portfolio.assetAllocation')}</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {/* Diversification Score */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('portfolio.diversification')}
              </span>
              <span className="text-2xl font-bold">{diversificationScore.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${diversificationScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {diversificationScore >= 70
                ? t('portfolio.excellentDiv')
                : diversificationScore >= 50
                ? t('portfolio.goodDiv')
                : t('portfolio.considerDiv')}
            </p>
          </div>

          {/* Risk Level */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('portfolio.riskLevel')}</span>
              <span className={`text-lg font-bold ${riskLevel.color}`}>{riskLevel.level}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('portfolio.riskBased')}
            </p>
          </div>

          {/* Total Yield */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('portfolio.totalYield')}
              </span>
              <span className={`text-lg font-bold ${totalYield >= 0 ? "text-green-500" : "text-red-500"}`}>
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
