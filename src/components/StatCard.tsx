import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  delay?: number;
}

const StatCard = ({ icon: Icon, label, value, change, changeType, delay = 0 }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary/20"
            >
              <Icon className="icon-card text-primary" />
            </div>
            {change !== undefined && (
              <Badge 
                variant={changeType === 'increase' ? 'default' : 'destructive'}
                className="flex items-center gap-1 text-xs"
              >
                {changeType === 'increase' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {Math.abs(change)}%
              </Badge>
            )}
          </div>
          
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{label}</p>
            <motion.p
              className="text-small-number break-words"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: delay + 0.2 }}
            >
              {value}
            </motion.p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
