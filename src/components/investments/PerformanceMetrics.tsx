import { TrendingUp, DollarSign, Target, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PerformanceMetricsProps {
  projectedValue: number;
  totalContributions: number;
  totalGains: number;
  taxLiability: number;
}

const mockHistoricalData = [
  { month: "Jan", value: 45000 },
  { month: "Feb", value: 47000 },
  { month: "Mar", value: 46500 },
  { month: "Apr", value: 49000 },
  { month: "May", value: 51000 },
  { month: "Jun", value: 52500 },
];

export const PerformanceMetrics = ({
  projectedValue,
  totalContributions,
  totalGains,
  taxLiability,
}: PerformanceMetricsProps) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const metrics = [
    {
      id: "projected",
      label: "Projected Value",
      value: projectedValue,
      icon: TrendingUp,
      color: "#6C00FF",
    },
    {
      id: "contributions",
      label: "Total Contributions",
      value: totalContributions,
      icon: DollarSign,
      color: "#9A5BFF",
    },
    {
      id: "gains",
      label: "Total Gains",
      value: totalGains,
      icon: Target,
      color: "#6C00FF",
    },
    {
      id: "tax",
      label: "Tax Liability",
      value: taxLiability,
      icon: Shield,
      color: "#9A5BFF",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className="performance-card cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color: metric.color }} />
                </div>
              </div>
              <p className="text-sm text-white/60 mb-1">{metric.label}</p>
              <p className="text-3xl font-bold font-mono text-white">
                ${metric.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-2xl bg-black border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Performance History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockHistoricalData}>
                  <XAxis
                    dataKey="month"
                    stroke="#ffffff60"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#ffffff60"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid #6C00FF",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6C00FF"
                    strokeWidth={3}
                    dot={{ fill: "#6C00FF", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-white/80">
                This chart shows the historical trend of your selected metric over the last 6 months.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
