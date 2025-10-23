import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = [
  '#6C00FF',
  '#9A5BFF',
  '#22C55E',
  '#EAB308',
  '#EF4444',
];

export const CategoriesDonutChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-categories', {
        body: {}
      });
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <Card className="modern-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  const categories = data?.categories || [];

  return (
    <Card className="modern-card p-6">
      <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categories}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="amount"
            label={(entry) => `${entry.percentage.toFixed(0)}%`}
          >
            {categories.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `€${value.toFixed(2)}`}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
