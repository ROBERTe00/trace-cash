import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  insight?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor, 
  bgColor,
  insight,
  trend = 'neutral',
  onClick
}: MetricCardProps) {
  const showChange = change !== undefined && change !== 0;
  const isPositive = change && change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="modern-card group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          
          {showChange && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold font-mono">
            {value}
          </p>
          
          {insight && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {insight}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

