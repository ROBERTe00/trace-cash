import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

interface ModernPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  centerLabel?: {
    title: string;
    value: string;
  };
  showPercentages?: boolean;
  height?: number;
}

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
  const radius = outerRadius + 35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for segments < 5%

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-bold text-sm"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export const ModernPieChart = ({
  data,
  centerLabel,
  showPercentages = true,
  height = 300,
}: ModernPieChartProps) => {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentages ? CustomLabel : false}
            outerRadius={110}
            innerRadius={0}
            fill="#8884d8"
            dataKey="value"
            stroke="#FFFFFF"
            strokeWidth={3}
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="transition-all hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `€${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{
              fontWeight: 600,
              color: "hsl(var(--foreground))",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        >
          <div className="text-center bg-background/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <p className="text-xs text-muted-foreground font-medium">{centerLabel.title}</p>
            <p className="text-4xl font-extrabold tracking-tight mt-1">{centerLabel.value}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
