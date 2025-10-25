import { motion } from "framer-motion";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: any;
    dataKey: string;
  }>;
  label?: string;
  formatter?: (value: number) => string;
}

export function CustomTooltip({ 
  active, 
  payload, 
  label,
  formatter = (value) => `$${value.toFixed(2)}`
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-morphism-dark rounded-xl p-4 border border-primary/30 shadow-[0_0_30px_rgba(123,47,247,0.4)]"
    >
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className="font-mono text-2xl font-bold text-primary">
        {formatter(payload[0].value)}
      </p>
    </motion.div>
  );
}

