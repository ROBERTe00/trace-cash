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

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, data }: any) => {
  if (percent < 0.05) return null;
  
  const radius = innerRadius + (outerRadius - innerRadius) / 2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  const color = data[index]?.color || "hsl(var(--primary))";

  return (
    <g>
      <circle 
        cx={x} 
        cy={y} 
        r={24} 
        fill="hsl(var(--card))" 
        opacity="0.98"
        stroke={color}
        strokeWidth={2}
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
      />
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-bold text-xs"
        style={{ pointerEvents: 'none' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
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
          <defs>
            {data.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentages ? (props: any) => <CustomLabel {...props} data={data} /> : false}
            outerRadius={100}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={4}
            paddingAngle={2}
            animationBegin={0}
            animationDuration={1500}
            animationEasing="ease-in-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient-${index})`}
                className="transition-all hover:opacity-90 cursor-pointer"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                }}
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
