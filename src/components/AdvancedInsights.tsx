/**
 * Advanced AI Insights Display Component
 * Interactive insights with animations and actionable recommendations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Lightbulb,
  Target,
  ArrowRight,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  BarChart3,
  DollarSign,
  PiggyBank,
  CreditCard
} from 'lucide-react';
import { AIInsight, Anomaly } from '@/lib/geminiAI';

interface AdvancedInsightsProps {
  insights: AIInsight[];
  anomalies: Anomaly[];
  summary: {
    totalExpenses: number;
    totalIncome: number;
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    monthlyTrend: 'increasing' | 'decreasing' | 'stable';
    spendingPattern: string;
    recommendations: string[];
  };
  onInsightAction?: (insight: AIInsight, action: string) => void;
  onAnomalyAction?: (anomaly: Anomaly, action: string) => void;
}

const insightIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  tip: Lightbulb
};

const insightColors = {
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    icon: 'text-primary'
  },
  tip: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400'
  }
};

const anomalyIcons = {
  duplicate: XCircle,
  unusual_amount: AlertTriangle,
  suspicious_pattern: Shield,
  missing_data: Info
};

const anomalyColors = {
  low: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: 'text-primary'
  },
  medium: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: 'text-yellow-600 dark:text-yellow-400'
  },
  high: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400'
  }
};

export const AdvancedInsights: React.FC<AdvancedInsightsProps> = ({
  insights,
  anomalies,
  summary,
  onInsightAction,
  onAnomalyAction
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'anomalies' | 'summary'>('insights');
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [expandedAnomaly, setExpandedAnomaly] = useState<number | null>(null);

  const tabs = [
    { id: 'insights', label: 'AI Insights', count: insights.length, icon: Sparkles },
    { id: 'anomalies', label: 'Anomalies', count: anomalies.length, icon: Shield },
    { id: 'summary', label: 'Summary', count: 0, icon: BarChart3 }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <h2 className="text-3xl font-bold gradient-text">AI Financial Analysis</h2>
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground">
          Personalized insights powered by advanced AI analysis
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {insights.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                  <p className="text-muted-foreground">
                    Upload more financial data to get personalized AI insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight, index) => {
                const Icon = insightIcons[insight.type];
                const colors = insightColors[insight.type];
                const isExpanded = expandedInsight === index;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`${colors.bg} ${colors.border} border transition-all duration-300 hover:shadow-lg`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`p-3 rounded-lg ${colors.bg}`}>
                            <Icon className={`w-6 h-6 ${colors.icon}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className={colors.text}>
                                    {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={getImpactColor(insight.impact)}
                                  >
                                    {insight.impact} impact
                                  </Badge>
                                </div>
                                <h3 className={`text-lg font-semibold ${colors.text}`}>
                                  {insight.title}
                                </h3>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedInsight(isExpanded ? null : index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </Button>
                            </div>

                            {/* Description */}
                            <p className={`${colors.text} leading-relaxed`}>
                              {insight.description}
                            </p>

                            {/* Expanded Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-3"
                                >
                                  <Separator className={colors.border} />
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Category</h4>
                                      <Badge variant="outline">{insight.category}</Badge>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Actionable</h4>
                                      <div className="flex items-center gap-2">
                                        {insight.actionable ? (
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="text-sm">
                                          {insight.actionable ? 'Yes' : 'No'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  {insight.actionable && onInsightAction && (
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        onClick={() => onInsightAction(insight, 'apply')}
                                        className="bg-primary hover:bg-primary/90"
                                      >
                                        <Target className="w-4 h-4 mr-2" />
                                        Apply Recommendation
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onInsightAction(insight, 'learn_more')}
                                      >
                                        Learn More
                                      </Button>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === 'anomalies' && (
          <motion.div
            key="anomalies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {anomalies.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Anomalies Detected</h3>
                  <p className="text-muted-foreground">
                    Your financial data looks clean and consistent
                  </p>
                </CardContent>
              </Card>
            ) : (
              anomalies.map((anomaly, index) => {
                const Icon = anomalyIcons[anomaly.type];
                const colors = anomalyColors[anomaly.severity];
                const isExpanded = expandedAnomaly === index;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`${colors.bg} border transition-all duration-300 hover:shadow-lg`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`p-3 rounded-lg ${colors.bg}`}>
                            <Icon className={`w-6 h-6 ${colors.icon}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className={colors.text}>
                                    {anomaly.type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={colors.text}
                                  >
                                    {anomaly.severity} severity
                                  </Badge>
                                </div>
                                <h3 className={`text-lg font-semibold ${colors.text}`}>
                                  {anomaly.description}
                                </h3>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedAnomaly(isExpanded ? null : index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </Button>
                            </div>

                            {/* Suggestion */}
                            <p className={`${colors.text} leading-relaxed`}>
                              <strong>Suggestion:</strong> {anomaly.suggestion}
                            </p>

                            {/* Expanded Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-3"
                                >
                                  <Separator />
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">Affected Transactions</h4>
                                    <div className="space-y-2">
                                      {anomaly.transactions.slice(0, 3).map((transaction, txIndex) => (
                                        <div key={txIndex} className="flex items-center justify-between p-2 bg-background/50 rounded">
                                          <span className="text-sm">{transaction.description}</span>
                                          <span className="text-sm font-medium">
                                            €{Math.abs(transaction.amount).toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                      {anomaly.transactions.length > 3 && (
                                        <p className="text-sm text-muted-foreground">
                                          +{anomaly.transactions.length - 3} more transactions
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  {onAnomalyAction && (
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        onClick={() => onAnomalyAction(anomaly, 'investigate')}
                                        className="bg-primary hover:bg-primary/90"
                                      >
                                        <Zap className="w-4 h-4 mr-2" />
                                        Investigate
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onAnomalyAction(anomaly, 'dismiss')}
                                      >
                                        Dismiss
                                      </Button>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Income vs Expenses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Total Income</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      €{summary.totalIncome.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-red-500" />
                      <span className="font-medium">Total Expenses</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      €{summary.totalExpenses.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Net Savings */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <PiggyBank className="w-5 h-5 text-primary" />
                    <span className="font-medium">Net Savings</span>
                  </div>
                  <div className={`text-3xl font-bold ${
                    summary.totalIncome - summary.totalExpenses >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    €{(summary.totalIncome - summary.totalExpenses).toLocaleString()}
                  </div>
                </div>

                {/* Monthly Trend */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Monthly Trend</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(summary.monthlyTrend)}
                    <span className="capitalize">{summary.monthlyTrend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Spending Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.topCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {category.percentage.toFixed(1)}%
                        </span>
                        {getTrendIcon(category.trend)}
                      </div>
                    </div>
                    <Progress 
                      value={category.percentage} 
                      className="h-2"
                    />
                    <div className="text-sm text-muted-foreground">
                      €{category.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedInsights;
