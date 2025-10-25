import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: LucideIcon;
  text: string;
  action?: { label: string; onClick: () => void };
}

interface AIInsightsCardProps {
  insights: Insight[];
  autoRotate?: boolean;
  rotationInterval?: number;
}

const typeConfig = {
  success: {
    badge: "bg-green-500/10 text-green-600 dark:text-green-400",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-600 dark:text-green-400"
  },
  warning: {
    badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-600 dark:text-yellow-400"
  },
  info: {
    badge: "bg-primary/10 text-primary",
    iconBg: "bg-primary/20",
    iconColor: "text-primary"
  },
  tip: {
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400"
  }
};

export const AIInsightsCard = ({ 
  insights, 
  autoRotate = true, 
  rotationInterval = 5000 
}: AIInsightsCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoRotate || insights.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, rotationInterval);

    return () => clearInterval(timer);
  }, [autoRotate, insights.length, rotationInterval]);

  if (insights.length === 0) {
    return (
      <Card className="relative overflow-hidden border-none shadow-lg rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-background" />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">AI Insights</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add more transactions to get personalized financial insights
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentInsight = insights[currentIndex];
  const Icon = currentInsight.icon;
  const config = typeConfig[currentInsight.type];

  return (
    <Card className="relative overflow-hidden border-none shadow-lg rounded-3xl">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
      
      {/* Animated Orbs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />

      <CardContent className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold">AI Insights</h3>
          </div>
          
          {insights.length > 1 && (
            <div className="flex gap-1">
              {insights.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-primary/30'
                  }`}
                  aria-label={`View insight ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${config.iconBg} flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className={`${config.badge} mb-2`}>
                  {currentInsight.type.charAt(0).toUpperCase() + currentInsight.type.slice(1)}
                </Badge>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {currentInsight.text}
                </p>
                
                {currentInsight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={currentInsight.action.onClick}
                    className="mt-3 text-primary hover:text-primary/80 p-0 h-auto font-medium"
                  >
                    {currentInsight.action.label}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
