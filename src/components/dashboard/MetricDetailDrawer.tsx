import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Insight {
  type: 'success' | 'warning' | 'info' | 'error';
  text: string;
  icon?: LucideIcon;
}

interface MetricDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  insights: Insight[];
  children: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
}

export function MetricDetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  bgColor,
  insights,
  children,
  actionButton
}: MetricDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {/* Header con icona grande */}
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-16 h-16 rounded-2xl ${bgColor} flex items-center justify-center`}
            >
              <Icon className={`w-8 h-8 ${iconColor}`} />
            </motion.div>
            <div>
              <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Grafico principale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {children}
        </motion.div>

        {/* Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 mb-6"
          >
            {insights.map((insight, index) => (
              <Card
                key={index}
                className={`p-4 border-0 ${
                  insight.type === 'success' ? 'bg-green-500/10' :
                  insight.type === 'warning' ? 'bg-yellow-500/10' :
                  insight.type === 'error' ? 'bg-red-500/10' :
                  'bg-blue-500/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.icon && (
                    <insight.icon className={`w-5 h-5 flex-shrink-0 ${
                      insight.type === 'success' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      insight.type === 'error' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                  )}
                  <p className="text-sm leading-relaxed">{insight.text}</p>
                </div>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Action Button */}
        {actionButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={actionButton.onClick}
              variant={actionButton.variant || 'default'}
              className="w-full"
            >
              {actionButton.label}
            </Button>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}

